"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const db_js_1 = require("./db.js");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_js_1 = require("./config.js");
const middleware_js_1 = require("./middleware.js");
const utils_js_1 = require("./utils.js");
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.post("/api/v1/signup", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    try {
        yield db_js_1.UserModel.create({
            username: username,
            password: password
        });
        res.json({
            message: "user signed up"
        });
    }
    catch (e) {
        res.status(411).json({
            message: "user already exists"
        });
    }
}));
app.post("api/v1/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const username = req.body.username;
    const password = req.body.password;
    const existingUser = yield db_js_1.UserModel.findOne({
        username,
        password
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            id: existingUser._id
        }, config_js_1.JWT_PASSWORD);
        res.json({
            token
        });
    }
    else {
        res.status(403).json({
            message: "incorrect credentials"
        });
    }
}));
app.post("api/v1/content", middleware_js_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const link = req.body.link;
    const type = req.body.type;
    yield db_js_1.ContentModel.create({
        link,
        type,
        //@ts-ignore
        userID: req.userID,
        tags: []
    });
    res.json({
        message: "content added",
    });
}));
app.get("/api/v1/content", middleware_js_1.userMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId; // User ID is fetched from middleware
    // Fetch all content associated with the user ID and populate username
    // The `populate` function is used to include additional details from the referenced `userId`.
    // For example, it will fetch the username linked to the userId.
    // Since we specified "username", only the username will be included in the result, 
    // and other details like password won’t be fetched.
    const content = yield db_js_1.ContentModel.find({ userId: userId }).populate("userId", "username");
    res.json(content);
}));
app.post("/api/v1/brain/share", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { share } = req.body;
    if (share) {
        // Check if a link already exists for the user.
        //@ts-ignore
        const existingLink = yield db_js_1.LinkModel.findOne({ userId: req.userId });
        if (existingLink) {
            res.json({ hash: existingLink.hash }); // Send existing hash if found.
            return;
        }
        // Generate a new hash for the shareable link.
        const hash = (0, utils_js_1.random)(10);
        //@ts-ignore
        yield db_js_1.LinkModel.create({ userId: req.userId, hash });
        res.json({ hash }); // Send new hash in the response.
    }
    else {
        // Remove the shareable link if share is false.
        //@ts-ignore
        yield db_js_1.LinkModel.deleteOne({ userId: req.userId });
        res.json({ message: "Removed link" }); // Send success response.
    }
}));
app.post("/api/v1/share", (req, res) => {
});
app.listen(3000);
