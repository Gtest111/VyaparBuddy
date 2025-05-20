const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const User = require("./models/User");
const Post = require("./models/Post");
const OpenAI = require("openai");
const NameData = require('./models/NameData');
const Message = require("./models/Message"); // Add this line
// Load environment variables
dotenv.config();

// Initialize Express and OpenAI
const app = express();
const openai = new OpenAI({ apiKey: "yr key"});

// Configure Express
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Add JSON parsing support

// Session configuration
app.use(session({
    secret: process.env.fake_SESSION_SECRET || "supersecretkey",
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI,
        ttl: 60 * 60 * 24 // 1 day
    }),
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24,
        secure: process.env.NODE_ENV === 'production'
    }
}));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("✅ MongoDB Connected"))
.catch((err) => console.log("❌ DB Connection Error:", err));

// Global user middleware
app.use(async (req, res, next) => {
    res.locals.user = null;
    
    if (req.session.userId) {
        try {
            const user = await User.findById(req.session.userId);
            res.locals.user = user;
        } catch (err) {
            console.error("Error fetching user:", err);
        }
    }
    next();
});

// Authentication middleware
const checkAuth = (req, res, next) => {
    if (!req.session.userId) {
        return res.redirect("/login?redirect=" + encodeURIComponent(req.originalUrl));
    }
    next();
};

// AI generated Hastags route
app.get("/suggest", checkAuth, (req, res) => {
    res.render("suggestions", { captions: [], hashtags: [] }); // Ensure empty arrays are passed
});

// Social Media Scheduler route
app.get("/scheduler", checkAuth, async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.session.userId })
                               .sort({ scheduleTime: 1 });
        
        // Get upcoming and past posts
        const now = new Date();
        const upcomingPosts = posts.filter(post => new Date(post.scheduleTime) > now);
        const pastPosts = posts.filter(post => new Date(post.scheduleTime) <= now);
        
        res.render("scheduler", { 
            title: "Social Media Scheduler - Vyapaar Buddy", 
            posts,
            upcomingPosts,
            pastPosts,
            filter: req.query.filter || 'all'
        });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to fetch posts" 
        });
    }
});

// Budget Optimizer route
app.get("/budget", checkAuth, async (req, res) => {
    try {
        // In a real app, we would fetch budget data from the database
        // For now, we'll use sample data
        const budgetData = {
            totalBudget: 10000,
            allocations: [
                { category: "Social Media Ads", amount: 3000, percentage: 30 },
                { category: "Content Creation", amount: 2500, percentage: 25 },
                { category: "Influencer Marketing", amount: 2000, percentage: 20 },
                { category: "Email Marketing", amount: 1500, percentage: 15 },
                { category: "Analytics Tools", amount: 1000, percentage: 10 }
            ],
            recommendations: [
                "Increase allocation to Social Media Ads by 5% for better reach",
                "Reduce Content Creation budget by 3% and reallocate to Influencer Marketing",
                "Consider investing in video content for higher engagement"
            ]
        };
        
        res.render("budget", { 
            title: "Budget Optimizer - Vyapaar Buddy",
            budgetData
        });
    } catch (err) {
        console.error("Error loading budget optimizer:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to load budget optimizer" 
        });
    }
});

// Customer Engagement route
app.get("/engagement", checkAuth, async (req, res) => {
    try {
        // In a real app, we would fetch engagement data from the database
        // For now, we'll use sample data
        const engagementData = {
            metrics: {
                totalFollowers: 5280,
                averageLikes: 342,
                averageComments: 48,
                averageShares: 15,
                engagementRate: 7.6
            },
            recentPosts: [
                { 
                    content: "Check out our new summer collection! 🌞 #SummerVibes", 
                    likes: 423, 
                    comments: 67, 
                    shares: 21,
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
                },
                { 
                    content: "Behind the scenes at our photo shoot today! 📸 #BehindTheScenes", 
                    likes: 387, 
                    comments: 42, 
                    shares: 13,
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
                },
                { 
                    content: "What's your favorite product from our collection? Let us know in the comments! 💬", 
                    likes: 298, 
                    comments: 89, 
                    shares: 8,
                    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                }
            ],
            recommendations: [
                "Post more content with questions to increase comment engagement",
                "Schedule posts between 6-8 PM for maximum reach",
                "Use more video content to boost engagement rates"
            ]
        };
        
        res.render("engagement", { 
            title: "Customer Engagement - Vyapaar Buddy",
            engagementData
        });
    } catch (err) {
        console.error("Error loading engagement dashboard:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to load engagement dashboard" 
        });
    }
});

// Error handler middleware
const errorHandler = (err, req, res, next) => {
    console.error("Application error:", err);
    res.status(500).render("error", { 
        title: "Error", 
        message: "Something went wrong",
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
};

// =============== AUTH ROUTES ===============

// Signup Page
app.get("/signup", (req, res) => {
    if (req.session.userId) return res.redirect("/");
    res.render("signup", { title: "Sign Up - SmartAdMate" });
});

// Login Page
app.get("/login", (req, res) => {
    if (req.session.userId) return res.redirect("/");
    const redirect = req.query.redirect || "/";
    res.render("login", { 
        title: "Login - SmartAdMate",
        redirect 
    });
});

// Signup Process
app.post("/signup", async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Basic validation
        if (!username || !email || !password) {
            return res.status(400).render("signup", {
                title: "Sign Up - SmartAdMate",
                error: "All fields are required",
                formData: { username, email }
            });
        }
        
        // Check for existing user
        const existingUser = await User.findOne({ 
            $or: [{ email }, { username }] 
        });
        
        if (existingUser) {
            return res.status(400).render("signup", {
                title: "Sign Up - SmartAdMate",
                error: existingUser.email === email ? "Email already registered" : "Username already taken",
                formData: { username, email }
            });
        }

        // Create new user
        const newUser = new User({ 
            username, 
            email, 
            password,
            createdAt: new Date()
        });
        
        await newUser.save();
        req.session.userId = newUser._id;
        res.redirect("/onboarding");
    } catch (err) {
        console.error("Signup error:", err);
        res.status(500).render("signup", {
            title: "Sign Up - SmartAdMate",
            error: "Error creating account",
            formData: req.body
        });
    }
});

// Login Process
app.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const redirect = req.body.redirect || "/";
        
        // Basic validation
        if (!email || !password) {
            return res.status(400).render("login", {
                title: "Login - SmartAdMate",
                error: "Email and password are required",
                redirect
            });
        }
        
        // Find user and check password
        const user = await User.findOne({ email });
        
        if (!user || user.password !== password) {
            return res.status(400).render("login", {
                title: "Login - SmartAdMate",
                error: "Invalid email or password",
                redirect
            });
        }

        // Update last login time
        user.lastLogin = new Date();
        await user.save();
        
        // Set session and redirect
        req.session.userId = user._id;
        res.redirect(redirect);
    } catch (err) {
        console.error("Login error:", err);
        res.status(500).render("login", {
            title: "Login - SmartAdMate",
            error: "Error logging in",
            redirect: req.body.redirect || "/"
        });
    }
});
app.get("/home", (req, res) => {
    res.render("homepage", { title: "Home - SmartAdMate" });
}); 
app.get("/pricing", (req, res) => {
    res.render("pricing", { title: "Pricing - SmartAdMate" });
});
// Logout
app.get("/logout", (req, res) => {
    req.session.destroy(() => {
        res.redirect("/login");
    });
});

// Onboarding Page
app.get("/onboarding", checkAuth, async (req, res) => {
    res.render("onboarding", { title: "Welcome to SmartAdMate" });
});

// =============== DASHBOARD ROUTES ===============

// Home/Dashboard Route
app.get("/", checkAuth, async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.session.userId })
                               .sort({ scheduleTime: 1 });
        
        // Get upcoming and past posts
        const now = new Date();
        const upcomingPosts = posts.filter(post => new Date(post.scheduleTime) > now);
        const pastPosts = posts.filter(post => new Date(post.scheduleTime) <= now);
        
        res.render("index", { 
            title: "SmartAdMate - Dashboard", 
            posts,
            upcomingPosts,
            pastPosts,
            caption: null,  
            hashtags: null,
            filter: req.query.filter || 'all'
        });
    } catch (err) {
        console.error("Error fetching posts:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to fetch posts" 
        });
    }
});

// Analytics Dashboard
app.get("/analytics", checkAuth, async (req, res) => {
    try {
        // Get posts for analytics
        const posts = await Post.find({ userId: req.session.userId });
        
        // Calculate analytics data
        const totalPosts = posts.length;
        const scheduledPosts = posts.filter(post => 
            new Date(post.scheduleTime) > new Date()
        ).length;
        
        const postedCount = totalPosts - scheduledPosts;
        
        // Group posts by day for chart data
        const postsByDay = {};
        posts.forEach(post => {
            const date = new Date(post.scheduleTime).toLocaleDateString();
            postsByDay[date] = (postsByDay[date] || 0) + 1;
        });
        
        res.render("analytics", {
            title: "Analytics - SmartAdMate",
            totalPosts,
            scheduledPosts,
            postedCount,
            postsByDay: JSON.stringify(postsByDay)
        });
    } catch (err) {
        console.error("Error loading analytics:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to load analytics" 
        });
    }
});

// =============== POST MANAGEMENT ROUTES ===============

// Schedule Post
app.post("/schedule", checkAuth, async (req, res) => {
    try {
        const { postContent, scheduleTime, platform } = req.body;
        
        // Validate input
        if (!postContent || !scheduleTime) {
            return res.status(400).send("Post content and schedule time are required");
        }
        
        const newPost = new Post({ 
            postContent, 
            scheduleTime, 
            platform: platform || 'all',
            userId: req.session.userId,
            createdAt: new Date(),
            status: new Date(scheduleTime) > new Date() ? 'scheduled' : 'posted'
        });
        
        await newPost.save();
        res.redirect("/?filter=upcoming");
    } catch (err) {
        console.error("Error scheduling post:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to schedule post" 
        });
    }
});

// Edit Post Page
app.get("/edit/:id", checkAuth, async (req, res) => {
    try {
        const post = await Post.findOne({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        
        if (!post) {
            return res.status(404).render("error", { 
                title: "Not Found", 
                message: "Post not found" 
            });
        }
        
        res.render("editPost", { 
            title: "Edit Post - SmartAdMate", 
            post 
        });
    } catch (err) {
        console.error("Error loading edit page:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to load edit page" 
        });
    }
});

// Update Post
app.post("/update/:id", checkAuth, async (req, res) => {
    try {
        const { postContent, scheduleTime, platform } = req.body;
        
        // Validate input
        if (!postContent || !scheduleTime) {
            return res.status(400).send("Post content and schedule time are required");
        }
        
        await Post.findOneAndUpdate(
            { _id: req.params.id, userId: req.session.userId },
            { 
                postContent, 
                scheduleTime,
                platform: platform || 'all',
                status: new Date(scheduleTime) > new Date() ? 'scheduled' : 'posted',
                updatedAt: new Date()
            }
        );
        
        res.redirect("/");
    } catch (err) {
        console.error("Error updating post:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to update post" 
        });
    }
});

// Delete Post
app.post("/delete/:id", checkAuth, async (req, res) => {
    try {
        const result = await Post.findOneAndDelete({ 
            _id: req.params.id, 
            userId: req.session.userId 
        });
        
        if (!result) {
            return res.status(404).render("error", { 
                title: "Not Found", 
                message: "Post not found" 
            });
        }
        
        res.redirect("back");
    } catch (err) {
        console.error("Error deleting post:", err);
        res.status(500).render("error", { 
            title: "Error", 
            message: "Failed to delete post" 
        });
    }
});

// =============== AI FEATURES ROUTES ===============




// Generate AI Content
app.post("/generate", checkAuth, async (req, res) => {
    try {
        const { description, contentType = 'both' } = req.body;
        
        if (!description) {
            return res.status(400).send("Description is required");
        }

        // Fetch the name data from MongoDB based on the provided description
        const matchingData = await NameData.findOne({ name: description });
      
        if (!matchingData) {
            return res.status(404).send("No relevant data found for the given description");
        }

        // Prepare the captions and hashtags based on the contentType
        let captions = [];
        let hashtags = [];

        if (contentType === 'caption') {
            captions = matchingData.captions;
        } else if (contentType === 'hashtags') {
            hashtags = matchingData.hashtags;
        } else {
            captions = matchingData.captions;
            hashtags = matchingData.hashtags;
        }
 
        // Fetch user posts for display
        const posts = await Post.find({ userId: req.session.userId })
                                .sort({ scheduleTime: 1 });

        // Render the dashboard page with retrieved data
        console.log(captions);
        res.render("index", { 
            title: "SmartAdMate - Dashboard", 
            posts,
            captions,  // Send the array of captions
            hashtags,  // Send the array of hashtags
            filter: 'all'
        });
    } catch (error) {
        console.error("Error generating content:", error);
        res.status(500).render("error", { 
            title: "AI Generation Error", 
            message: "Failed to generate content" 
        });
    }
});




app.post("/post/:id/like", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send("Post not found");

        post.likes += 1;
        await post.save();

        res.json({ success: true, likes: post.likes });
    } catch (err) {
        console.error("Error liking post:", err);
        res.status(500).json({ success: false, message: "Failed to like post" });
    }
});

app.post("/post/:id/dislike", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).send("Post not found");

        post.dislikes += 1;
        await post.save();

        res.json({ success: true, dislikes: post.dislikes });
    } catch (err) {
        console.error("Error disliking post:", err);
        res.status(500).json({ success: false, message: "Failed to dislike post" });
    }
});

// Add chat page route
app.get("/chat", (req, res) => {
    res.render("chat", { title: "AI Assistant - SmartAdMate" });
});
// =============== API ROUTES ===============

// Get all posts (JSON API)
app.get("/api/posts", checkAuth, async (req, res) => {
    try {
        const posts = await Post.find({ userId: req.session.userId })
                               .sort({ scheduleTime: 1 });
        res.json(posts);
    } catch (err) {
        console.error("API error:", err);
        res.status(500).json({ error: "Failed to fetch posts" });
    }
});

// Get user profile (JSON API)
app.get("/api/profile", checkAuth, async (req, res) => {
    try {
        const user = await User.findById(req.session.userId).select('-password');
        res.json(user);
    } catch (err) {
        console.error("API error:", err);
        res.status(500).json({ error: "Failed to fetch profile" });
    }
});

// =============== ERROR HANDLING ===============

// 404 Handler
app.use((req, res) => {
    res.status(404).render("error", { 
        title: "Page Not Found", 
        message: "The page you're looking for doesn't exist." 
    });
});

// Chat API endpoint
app.post("/api/chat", checkAuth, async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid request format" });
        }
        
        // Get user information to personalize the response
        const user = await User.findById(req.session.userId);
        
        // Add user context if not already present in the first message
        if (!messages[0].content.includes(user.username)) {
            messages[0].content += ` The user's name is ${user.username}.`;
        }
        
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        });
        
        // Get the assistant's response
        const assistantMessage = response.choices[0].message.content;
        
        // Log the interaction for analytics (optional)
        console.log(`Chat interaction - User: ${user.username}, Message: ${messages[messages.length - 1].content.substring(0, 50)}...`);
        
        res.json({ message: assistantMessage });
    } catch (error) {
        console.error("Error in chat API:", error);
        res.status(500).json({ error: "Failed to process chat request" });
    }
});
// Enhanced Chat API with history
// Enhanced Chat API with history
app.post("/api/chat", checkAuth, async (req, res) => {
    try {
        const { messages, conversationId = Date.now().toString() } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid request format" });
        }
        
        // Get user information to personalize the response
        const user = await User.findById(req.session.userId);
        
        // If new conversation, store system message
        if (messages.length <= 2) {
            await new Message({
                userId: user._id,
                role: "system",
                content: messages[0].content,
                conversationId
            }).save();
            
            // Store initial assistant greeting if present
            if (messages.length === 2) {
                await new Message({
                    userId: user._id,
                    role: "assistant",
                    content: messages[1].content,
                    conversationId
                }).save();
            }
        }
        
        // Store user message
        const userMessage = messages[messages.length - 1];
        await new Message({
            userId: user._id,
            role: userMessage.role,
            content: userMessage.content,
            conversationId
        }).save();
        
        // Call OpenAI API
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: messages,
            temperature: 0.7,
            max_tokens: 500
        });
        
        // Get the assistant's response
        const assistantMessage = response.choices[0].message.content;
        
        // Store assistant response
        await new Message({
            userId: user._id,
            role: "assistant",
            content: assistantMessage,
            conversationId
        }).save();
        
        res.json({ 
            message: assistantMessage,
            conversationId
        });
    } catch (error) {
        console.error("Error in chat API:", error);
        res.status(500).json({ error: "Failed to process chat request" });
    }
});

// Get conversation history
app.get("/api/chat/history", checkAuth, async (req, res) => {
    try {
        const { conversationId } = req.query;
        
        if (!conversationId) {
            // Get list of conversations
            const conversations = await Message.aggregate([
                { $match: { userId: mongoose.Types.ObjectId(req.session.userId) } },
                { $sort: { timestamp: -1 } },
                { $group: { 
                    _id: "$conversationId",
                    lastMessage: { $first: "$content" },
                    timestamp: { $first: "$timestamp" }
                }},
                { $limit: 10 }
            ]);
            
            return res.json({ conversations });
        }
        
        // Get messages for specific conversation
        const messages = await Message.find({ 
            userId: req.session.userId,
            conversationId
        }).sort({ timestamp: 1 });
        
        res.json({ messages });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({ error: "Failed to fetch chat history" });
    }
});






// Error handler middleware
app.use(errorHandler);

// =============== SERVER STARTUP ===============

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🌎 Environment: ${process.env.NODE_ENV || 'development'}`);
});