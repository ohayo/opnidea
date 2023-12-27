const express = require('express');
const database = require('../helpers/database');
const checkBan = require('../helpers/general').checkBan;
const router = express.Router();
const request = require('request');
const cacheManager = require('../helpers/cacheManager');

router.get("/:postid", async (req, res) => {
    try {
        let user = await database.getUserByAuth(req.headers.authorization);

        let entry = cacheManager.findById(req.params.postid);

        if (entry == null) {
            let post = await database.getPostById(req.params.postid);

            if (post == null) {
                return res.status(404).json({
                    success: false,
                    message: "Post not found."
                });
            }
    
            if (post.privacy == 2 && post.author.id != user.id) {
                return res.status(401).json({
                    success: false,
                    message: "Post is private."
                })
            }

            let postCollections = await database.getPostsCollections(post.id);

            postCollections = postCollections.filter(x => x.privacy == 0);
    
            post.collections = postCollections;

            cacheManager.add(req.params.postid, 200, post);
        }

        entry = cacheManager.findById(req.params.postid);

        let postlol = entry.response.json;

        let collections = [];
        let liked = false;
        
        if (user != null) {
          collections = await database.getUserCollections(user.id);
          for(var collection of collections) {
              if (collection.id == user.id && collection.posts.filter(x => x.id == postlol.id).length > 0) {
                liked = true;
              }
          }
        }

        let posted_by_you = false;

        if (user != null)  {
            posted_by_you = postlol.author.id == user.id;
        }

        postlol.context = {
            liked: liked,
            posted_by_you: posted_by_you
        }

        return res.status(200).json(postlol);
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.delete("/:postid", async (req, res) => {
    try {
        if (!req.headers.authorization) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let user = await database.getUserByAuth(req.headers.authorization);

        let post = await database.getPostById(req.params.postid);

        if (post == null) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        if (post.author.id != user.id) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        let attempt = await database.deletePost(user.id, post.id);

        if (!attempt) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while deleting this post."
            });
        }

        let entry = cacheManager.findById(req.params.postid);

        if (entry != null) {
            cacheManager.remove(req.params.postid);
        }

        return res.status(200).json({
            success: true
        });
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.patch("/:postid" , async (req, res) => {
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

        if (!user.verified) {
            return res.status(401).json({
                success: false,
                message: "You need to verify your account before you can do that action."
            });
        }

        let ban = await checkBan(user);

        if (ban) {
            return res.status(401).json({
                success: false,
                message: `You are currently banned ${user.bannedUntil == 'never' ? 'permanently.' : 'until ' + `${new Date(user.bannedUntil).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}`}. Contact support if you believe this action is unfair.`
            });
        }

        let post = await database.getPostById(req.params.postid);

        if (post == null) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        if (post.privacy == 2 && post.author.id != user.id) {
            return res.status(401).json({
                success: false,
                message: "Post is private."
            });
        }

        if (!req.body.action) {
            return res.status(400).json({
                success: false,
                message: "A post action is required."
            })
        }

        if (req.body.action.toLowerCase() != "like" && req.body.action.toLowerCase() != "report") {
            return res.status(400).json({
                success: false,
                message: "Invalid post action. (Valid types are like, report)"
            })
        }

        if (req.body.action.toLowerCase() != "report") {
            let collections = await database.getUserCollections(user.id);
            let liked = false;
    
            for(var collection of collections) {
                if (collection.id == user.id && collection.posts.filter(x => x.id == post.id).length > 0) {
                    liked = true;
                }
            }

            let entry = cacheManager.findById(req.params.postid);

            if (entry != null) {
                cacheManager.remove(req.params.postid);
            }
    
            if (!liked) {
                let trylol = await database.likePost(user.id, post.id);
    
                if (!trylol) {
                    return res.status(400).json({
                        success: false,
                        message: "Something went wrong while liking this post."
                    });
                }  
    
                return res.status(200).json({
                    result: "liked"
                });
            } else {
                let trylol = await database.unlikePost(user.id, post.id);
    
                if (!trylol) {
                    return res.status(400).json({
                        success: false,
                        message: "Something went wrong while unliking this post."
                    });
                }
    
                return res.status(200).json({
                    result: "unliked"
                });
            }
        } else {
            request.post(`https://discord.com/api/webhooks/1158948910476316682/-l8ezl2gDd7r9dS6wYBVH2WxJeIpXBwAkjMEX1-QdrAVP3A0paTdwoNz3mXIOL2y5U6E`, {
                    json: true,
                    body: {
                        content: "",
                        username: "OPNIDEA | POST REPORTS",
                        tts: false,
                        embeds: [{
                            title: "Post Report!",
                            author: {
                                name: `Submitted by User ID: ${user.id}`,
                            },
                            color: 0xfb0707,
                            fields: [{
                                name: "Post",
                                value: `https://opnidea.com/posts/${post.id}`,
                                inline: false
                            }]
                        }]
                    }
            })

            return res.status(200).json({
                success: true
            });
        }
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.post("/:postid/comments", async (req, res) => {
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

        if (!user.verified) {
            return res.status(401).json({
                success: false,
                message: "You need to verify your account before you can do that action."
            });
        }

        let ban = await checkBan(user);

        if (ban) {
            return res.status(401).json({
                success: false,
                message: `You are currently banned ${user.bannedUntil == 'never' ? 'permanently.' : 'until ' + `${new Date(user.bannedUntil).toLocaleString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric', hour: 'numeric', minute: 'numeric' })}`}. Contact support if you believe this action is unfair.`
            });
        }

        let post = await database.getPostById(req.params.postid);

        if (post == null) {
            return res.status(404).json({
                success: false,
                message: "Post not found."
            });
        }

        if (post.privacy == 2 && post.author.id != user.id) {
            return res.status(401).json({
                success: false,
                message: "Post is private."
            });
        }

        if (!req.body.content) {
            return res.status(400).json({
                success: false,
                message: "A comment is required."
            })
        }

        if (req.body.content.length < 2) {
            return res.status(400).json({
                success: false,
                message: "A comment must be no longer than 500 characters and no shorter than 2 characters in length."
            })
        }

        if (req.body.content.length > 500) {
            return res.status(400).json({
                success: false,
                message: "A comment must be no longer than 500 characters and no shorter than 2 characters in length."
            })
        }

        let attempt = await database.addComment(user.id, post.id, req.body.content);

        if (!attempt) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while publishing your comment. Try again later!"
            })
        }

        let entry = cacheManager.findById(req.params.postid);

        if (entry != null) {
            cacheManager.remove(req.params.postid);
        }

        return res.status(200).json({
            success: true
        });
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