const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const User = require("./models/User");
const Post = require("./models/Post");
const app = express();

dotenv.config();

// Set up EJS
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
// Middleware to pass user data to views

// Session management
app.use(session({
    secret: "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ mongoUrl: process.env.MONGO_URI }),
    cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1-day expiration
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ DB Connection Error:", err));

// Middleware for authentication check
const checkAuth = (req, res, next) => {
    if (!req.session.userId) return res.redirect("/login");
    next();
};

// ✅ Home Route (Protected)
app.get("/", checkAuth, async (req, res) => {
    try {
        const posts = await Post.find();
        const user = await User.findById(req.session.userId); // Fetch user from DB

        res.render("index", { title: "SmartAdMate - Dashboard", posts, user }); 
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).send("Failed to fetch posts");
    }
});


// ✅ Signup Page
app.get("/signup", (req, res) => {
    res.render("signup", { title: "Signup - SmartAdMate" });
});

// ✅ Login Page
app.get("/login", (req, res) => {
    res.render("login", { title: "Login - SmartAdMate" });
});

// ✅ Signup Route
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).send("Email already registered!");

        const newUser = new User({ username, email, password });
        await newUser.save();
        res.redirect("/login");
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).send("Error signing up");
    }
});

// ✅ Login Route
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, password });

        if (!user) {
            res.status(400).send("Invalid email or password"); // ❌ Issue: Response sent here
        } else {
            req.session.userId = user._id;
            res.redirect("/"); // ❌ Issue: Another response sent
        }
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).send("Error logging in");
    }
});

// ✅ Logout Route
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// ✅ Post Scheduling Route
app.post("/schedule", checkAuth, async (req, res) => {
    try {
        const { postContent, scheduleTime } = req.body;
        const newPost = new Post({ postContent, scheduleTime });
        await newPost.save();
        res.redirect("/");
    } catch (err) {
        console.error("Error scheduling post:", err);
        res.status(500).send("Failed to schedule post");
    }
});

// ✅ Delete Post Route
app.post("/delete/:id", checkAuth, async (req, res) => {
    try {
        await Post.findByIdAndDelete(req.params.id);
        res.redirect("/");
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).send("Failed to delete post");
    }
});

// ✅ Edit Post Page
app.get("/edit/:id", checkAuth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        res.render("editPost", { title: "Edit Post - SmartAdMate", post });
    } catch (err) {
        console.error("Error loading edit page:", err);
        res.status(500).send("Failed to load edit page");
    }
});

// ✅ Update Post Route
app.post("/update/:id", checkAuth, async (req, res) => {
    try {
        const { postContent, scheduleTime } = req.body;
        await Post.findByIdAndUpdate(req.params.id, { postContent, scheduleTime });
        res.redirect("/");
    } catch (err) {
        console.error("Error updating post:", err);
        res.status(500).send("Failed to update post");
    }
});
app.get("/dashboard", async (req, res) => {
    if (!req.session.userId) {
        return res.redirect("/login"); // Redirect if not logged in
    }

    try {
        const user = await User.findById(req.session.userId);
        const posts = await Post.find({ userId: user._id }).sort({ scheduleTime: 1 });
        res.render("dashboard", { title: "Dashboard", user, posts });
    } catch (err) {
        console.error("Error loading dashboard:", err);
        res.status(500).send("Error loading dashboard");
    }
});
app.use((req, res, next) => {
    res.locals.user = req.session.userId ? { username: req.session.username } : null;
    next();
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
