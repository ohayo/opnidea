const express = require('express');
const database = require('../helpers/database');
const checkBan = require('../helpers/general').checkBan;
const router = express.Router();
const cacheManager = require('../helpers/cacheManager');

router.get("/:collectionId", async (req, res) => {
    try {      
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null) {
            user = {
              id: "user_id"
            }
        }

        let entry = cacheManager.findById(req.params.collectionId);

        if (entry == null) {
            let collections = await database.getCollections();

            collections = collections.filter(x => x.id == req.params.collectionId);
    
            if (collections.length == 0) {
                return res.status(404).json({
                    success: false,
                    message: "Collection not found."
                })
            }
    
            if (collections[0].privacy == 2 && collections[0].author_id != user.id) {
                return res.status(401).json({
                    success: false,
                    message: "Collection is private."
                })
            }

            cacheManager.add(req.params.collectionId, 200, collections[0]);

            return res.status(200).json(collections[0]);
        }

        console.log(entry);

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

router.patch("/:collectionId", async (req, res) => {
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

        let ban = await checkBan(user);

        if (ban) {
            return res.status(401).json({
                success: false,
                message: `You are currently banned ${user.bannedUntil == 'never' ? 'permanently.' : 'until ' + `${new Date(user.bannedUntil).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}`}. Contact support if you believe this action is unfair.`
            });
        }

        let collections = await database.getCollections();

        collections = collections.filter(x => x.id == req.params.collectionId);

        if (collections.length == 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            })
        }

        if (collections[0].author_id != user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            })
        }

        if (req.body.add_post) {
            let attempt = await database.addToCollection(user.id, req.params.collectionId, req.body.add_post);

            if (!attempt) {
                return res.status(400).json({
                    success: false,
                    message: "Something went wrong while adding post to collection. Perhaps it's already in it?"
                })
            }

            let entry = cacheManager.findById(req.params.collectionId);

            if (entry != null) {
                cacheManager.remove(req.params.collectionId);
            }

            return res.status(200).json({
                success: true
            })
        } else if (req.body.remove_post) {
            let attempt = await database.removeFromCollection(user.id, req.params.collectionId, req.body.remove_post);

            if (!attempt) {
                return res.status(400).json({
                    success: false,
                    message: "Something went wrong while removing post from collection. Perhaps it's not in it?"
                })
            }

            let entry = cacheManager.findById(req.params.collectionId);

            if (entry != null) {
                cacheManager.remove(req.params.collectionId);
            }

            return res.status(200).json({
                success: true
            })
        } else {
            if (!req.body.name && !req.body.privacy) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid body parameters (Valid parameters are add_post, rmove_post, name and privacy)"
                })
            }

            if (req.body.name.length < 2) {
                return res.status(400).json({
                    success: false,
                    message: "Collection names must be no longer than 100 characters and 2 characters minimum in length."
                })
            }

            if (req.body.name.length > 100) {
                return res.status(400).json({
                    success: false,
                    message: "Collection names must be no longer than 100 characters and 2 characters minimum in length."
                })
            }

            let privacy_int = 0;

            if (req.body.privacy && req.body.privacy.toLowerCase() == "private") {
                privacy_int = 2;
            } else if (req.body.privacy && req.body.privacy.toLowerCase() == "semi-public") {
                privacy_int = 1;
            }

            let attempt = await database.updateCollection(user.id, req.params.collectionId, {
                name: req.body.name,
                privacy: privacy_int
            });

            if (!attempt) {
                return res.status(500).json({
                    success: false,
                    message: "Internal Server Error. Try again later."
                });
            }

            let entry = cacheManager.findById(req.params.collectionId);

            if (entry != null) {
                cacheManager.remove(req.params.collectionId);
            }

            return res.status(200).json({
                success: true
            })
        }
    }
    catch (error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.delete("/:collectionId", async (req, res) => {
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

        let ban = await checkBan(user);

        if (ban) {
            return res.status(401).json({
                success: false,
                message: `You are currently banned ${user.bannedUntil == 'never' ? 'permanently.' : 'until ' + `${new Date(user.bannedUntil).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}`}. Contact support if you believe this action is unfair.`
            });
        }

        let collections = await database.getCollections();

        collections = collections.filter(x => x.id == req.params.collectionId);

        if (collections.length == 0) {
            return res.status(404).json({
                success: false,
                message: "Collection not found."
            })
        }

        if (collections[0].author_id != user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        if (collections[0].id == user.id) {
            return res.status(400).json({
                success: false,
                message: "You can't delete this collection!"
            });
        }

        let attempt = await database.deleteCollection(user.id, req.params.collectionId);

        if (!attempt) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error. Try again later."
            });
        }

        let entry = cacheManager.findById(req.params.collectionId);

        if (entry != null) {
            cacheManager.remove(req.params.collectionId);
        }

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
})

module.exports = router;