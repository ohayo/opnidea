const express = require('express');
const database = require('../helpers/database');
const router = express.Router();
const cacheManager = require('../helpers/cacheManager');

router.get("/", async (req, res) => {
    try {
        let entry = cacheManager.findById("categories");

        if (entry == null) {
            let categories = await database.getOfficialCategories();

            let ret = [];
    
            for(var category of categories) {
                ret.push(category);
            }
    
            let unofficial = await database.getUnOfficialCategories();
    
            for(var un of unofficial) {
                let posts = await database.getPosts();
    
                posts = posts.filter(x => x.category.toLowerCase() == un.toLowerCase());
    
                if (posts.length > 3) {
                    ret.push(un);
                }
            }

            cacheManager.add("categories", 200, ret);
    
            return res.status(200).json(ret);
        }
        
        return res.status(entry.response.status_code).json(entry.response.json);
    }
    catch (error) {
        console.log(error);
        
        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.get("/:category/thumbnails", async (req, res) => {
    if (!req.params.category) {
        return res.status(404).json({
            message: "Category not found."
        })
    }

    let entry = cacheManager.findById(`${req.params.category}-thumbnails`);

    if (entry == null) {
        let category = await database.getOfficialCategories();
        let unofficial = await database.getUnOfficialCategories();
    
        if (category.filter(x => x.toLowerCase() == req.params.category.toLowerCase()).length == 0 && unofficial.filter(y => y.toLowerCase() == req.params.category.toLowerCase()).length == 0) {
            return res.status(404).json({
                message: "Category not found."
            })
        }
    
        let thumbnails = await database.getThumbnailsByCategory(req.params.category);
        
        thumbnails = thumbnails.filter(x => x.name.length > 1 && !x.name.includes(" "));

        return res.status(200).json(thumbnails); 
    }

    return res.status(entry.response.status_code).json(entry.response.json);
});

router.get("/:category/posts", async (req, res) => {
    if (!req.params.category) {
        return res.status(404).json({
            message: "Category not found."
        })
    }

    let entry = cacheManager.findById(`${req.params.category}-posts`);

    if (entry == null) {
        let category = await database.getOfficialCategories();
        let unofficial = await database.getUnOfficialCategories();
    
        if (category.filter(x => x.toLowerCase() == req.params.category.toLowerCase()).length == 0 && unofficial.filter(y => y.toLowerCase() == req.params.category.toLowerCase()).length == 0) {
            return res.status(404).json({
                message: "Category not found."
            })
        }
    
        let posts = await database.getPosts();
    
        posts = posts.filter(x => x.category.toLowerCase() == req.params.category.toLowerCase());

        cacheManager.add(`${req.params.category}-posts`, 200, posts);
    
        return res.status(200).json(posts);
    }

    return res.status(entry.response.status_code).json(entry.response.json);
});

module.exports = router;