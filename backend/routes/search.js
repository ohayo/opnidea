const express = require('express');
const database = require('../helpers/database');
const cacheManager = require('../helpers/cacheManager');
const router = express.Router();

router.get("/", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let query = req.query.query;

        if (!query) {
            return res.status(400).json({
                success: false
            });
        }

        let entry = cacheManager.findById(`search-${query.replace(" ", "")}`);

        if (entry == null) {
            let posts = await database.getPosts();

            posts = posts.filter(x => x.caption.toLowerCase().includes(query.toLowerCase()) && x.privacy == 0);
    
            if (posts.length > 10) {
                posts = posts.splice(0, 10);
            }

            cacheManager.add(`search-${query.replace(" ", "")}`, 200, posts);
    
            return res.status(200).json(posts);
        }

        return res.status(entry.response.status_code).json(entry.response.json);
    }
    catch(error) {
        console.log(error);
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.get("/recommendations" , async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }
        
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let query = req.query.query;

        if (!query) {
            return res.status(400).json({
                success: false
            });
        }

        let entry = cacheManager.findById(`recommendations-${query.replace(" ", "")}`);

        if (entry == null) {
            let posts = await database.getPosts();

            posts = posts.filter(x => x.caption.toLowerCase().includes(query.toLowerCase()) && x.privacy == 0);
    
            if (posts.length > 10) {
                posts = posts.splice(0, 10);
            }

            cacheManager.add(`recommendations-${query.replace(" ", "")}`, 200, posts);
    
            return res.status(200).json(posts);
        }

        return res.status(entry.response.status_code).json(entry.response.json);
    }
    catch(error) {
        console.log(error);
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

module.exports = router;