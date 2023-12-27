const express = require('express');
const database = require('../helpers/database');

const router = express.Router();

router.get("/stats", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null || !user.moderator) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let stats = await database.getStats();

        return res.status(200).json(stats);
    }
    catch (error) {
        console.log(error);
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.get("/users/:query", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null || !user.moderator) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let searched = await database.getUserById(req.params.query);

        if (searched == null) {
            searched = await database.getUserByUsername(req.params.query);

            if (searched == null) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
        }

        return res.status(200).json(searched);
    }
    catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.get("/posts/:query", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null || !user.moderator) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let searched = await database.getPostById(req.params.query);

        if (searched == null) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        return res.status(200).json(searched);
    }
    catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.delete("/users/:query", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null || !user.moderator) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let searched = await database.getUserById(req.params.query);

        if (searched == null) {
            searched = await database.getUserByUsername(req.params.query);

            if (searched == null) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
        }

        await database.deleteUser(searched.id);

        return res.status(200).json({
            success: true
        })
    }
    catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.delete("/posts/:query", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null || !user.moderator) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let searched = await database.getPostById(req.params.query);

        if (searched == null) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        await database.deletePost(searched.author.id, searched.id);

        return res.status(200).json({
            success: true
        })
    }
    catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

module.exports = router;