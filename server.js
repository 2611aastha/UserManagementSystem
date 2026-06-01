const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const multer = require("multer");

const User = require("./models/User");

const app = express();

const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, "uploads/");
    },

    filename: function(req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }

});

const upload = multer({ storage: storage });

mongoose.connect(
    "mongodb://127.0.0.1:27017/UserManagementDB"
)
.then(() => {
    console.log("MongoDB Connected");
})
.catch((err) => {
    console.log(err);
});

app.set("view engine", "ejs");

app.use(express.urlencoded({ extended: true }));

app.use("/uploads", express.static("uploads"));

app.use(
    session({
        secret: "mysecret",
        resave: false,
        saveUninitialized: false
    })
);

app.get("/", (req, res) => {
    res.render("home");
});

app.get("/register", (req, res) => {
    res.render("register");
});

app.post(
    "/register",
    upload.single("profilePicture"),
    async (req, res) => {

    try {

        const hashedPassword =
            await bcrypt.hash(req.body.password, 10);

            await User.create({

        name: req.body.name,

        email: req.body.email,

        contact: req.body.contact,

        profilePicture: req.file
            ? req.file.filename
            : "",

        password: hashedPassword,

        role: "user",

        status: "Inactive"
    });

        res.send("User Registered Successfully");

    } catch (error) {

        if (error.code === 11000) {
            return res.send("Email already exists");
        }

        console.log(error);
        res.send("Something went wrong");
    }
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", async (req, res) => {

    const user = await User.findOne({
        email: req.body.email
    });

    if (!user) {
        return res.send("User Not Found");
    }

    const match =
        await bcrypt.compare(
            req.body.password,
            user.password
        );

    if (!match) {
        return res.send("Wrong Password");
    }

    req.session.user = user;

    if (user.role === "admin") {
        return res.redirect("/admin/dashboard");
    }

    res.redirect("/user/dashboard");
});

app.get("/user/dashboard", (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    res.render("user-dashboard");
});

app.get("/admin/dashboard", async (req, res) => {

    if (!req.session.user) {
        return res.redirect("/login");
    }

    if (req.session.user.role !== "admin") {
        return res.send("Access Denied");
    }

    const users = await User.find();

    const totalUsers = users.length;

    const activeUsers =
        users.filter(
            u => u.status === "Active"
        ).length;

    const inactiveUsers =
        users.filter(
            u => u.status === "Inactive"
        ).length;

    const admins =
        users.filter(
            u => u.role === "admin"
        ).length;

    res.render(
        "admin-dashboard",
        {
            users,
            totalUsers,
            activeUsers,
            inactiveUsers,
            admins
        }
    );

});

// ACTIVATE USER
app.get("/activate/:id", async (req, res) => {

    if (
    !req.session.user ||
    req.session.user.role !== "admin"
) {
    return res.send("Access Denied");
}

    await User.findByIdAndUpdate(
        req.params.id,
        {
            status: "Active"
        }
    );

    res.redirect("/admin/dashboard");
});


// DEACTIVATE USER
app.get("/deactivate/:id", async (req, res) => {

    if (
    !req.session.user ||
    req.session.user.role !== "admin"
) {
    return res.send("Access Denied");
}

    await User.findByIdAndUpdate(
        req.params.id,
        {
            status: "Inactive"
        }
    );

    res.redirect("/admin/dashboard");
});


// DELETE USER
app.get("/delete/:id", async (req, res) => {

    if (
    !req.session.user ||
    req.session.user.role !== "admin"
) {
    return res.send("Access Denied");
}

    await User.findByIdAndDelete(
        req.params.id
    );

    res.redirect("/admin/dashboard");
});

app.get("/edit/:id", async (req, res) => {

    if (
    !req.session.user ||
    req.session.user.role !== "admin"
) {
    return res.send("Access Denied");
}

    const user =
        await User.findById(req.params.id);

    res.render("edit-user", { user });

});

app.post(
    "/edit/:id",
    upload.single("profilePicture"),
    async (req, res) => {

        if (
    !req.session.user ||
    req.session.user.role !== "admin"
) {
    return res.send("Access Denied");
}

    const updateData = {

    name: req.body.name,

    email: req.body.email,

    contact: req.body.contact
};

if(req.file){
    updateData.profilePicture =
        req.file.filename;
}

await User.findByIdAndUpdate(
    req.params.id,
    updateData
);

    res.redirect("/admin/dashboard");

});

app.get("/logout", (req, res) => {

    req.session.destroy(() => {

        res.redirect("/login");

    });

});

app.listen(3000, () => {
    console.log("Server Running On Port 3000");
});