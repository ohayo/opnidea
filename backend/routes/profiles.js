const express = require('express');
const database = require('../helpers/database');
const request = require('request');
const router = express.Router();
const checkBan = require('../helpers/general').checkBan;
const cacheManager = require('../helpers/cacheManager');

router.get("/:userid", async (req, res) => {
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

        let entry = cacheManager.findById(req.params.userid);

        if (entry == null) {
            let profile = await database.getProfileById(req.params.userid);

            if (profile == null) {
                profile = await database.getProfileByUsername(req.params.userid);
    
                if (profile == null) {
                    return res.status(404).json({
                        success: false,
                        message: "Profile not found."
                    });
                }
            }
    
            if (profile.bannedUntil != null) {
                return res.status(404).json({
                    success: false,
                    message: "Profile not found."
                });
            }
    
            let bio = profile.bio;
    
            if (bio == "undefined" || bio == undefined) {
                bio = null;
            }
    
            let pros = [];
    
            if (profile.pronouns != "" && profile.pronouns != null) {
                pros.push(profile.pronouns);
            }
    
            let can_message = true;
    
            if (profile.id != user.id) {
                if (profile.dm_privacy == 2) {
                    can_message = false;
                } else if (profile.dm_privacy == 1 && profile.following.filter(x => x.id == user.id).length == 0) {
                    can_message = false;
                }
            }
    
            if (!user.verified) {
                can_message = false;
            }

            cacheManager.add(req.params.userid, 200, {
                avatar: profile.avatar == "null" ? '/files/default_pfp.png' : profile.avatar,
                id: profile.id,
                badges: profile.badges,
                banner: profile.banner == "null" ? null : profile.banner,
                bio: bio,
                username: profile.username,
                privacy: profile.privacy,
                dm_privacy: profile.dm_privacy,
                moderator: profile.moderator,
                pronouns: pros,
                music_url: profile.music_url,
                followers: profile.followers,
                following: profile.following
            });
    
            return res.status(200).json({
                avatar: profile.avatar == "null" ? '/files/default_pfp.png' : profile.avatar,
                id: profile.id,
                badges: profile.badges,
                banner: profile.banner == "null" ? null : profile.banner,
                bio: bio,
                username: profile.username,
                privacy: profile.privacy,
                dm_privacy: profile.dm_privacy,
                moderator: profile.moderator,
                pronouns: pros,
                music_url: profile.music_url,
                followers: profile.followers,
                following: profile.following,
                context: {
                    following: profile.followers.filter(x => x.id == user.id).length > 0,
                    you: profile.id == user.id,
                    can_message: can_message
                }
            }); 
        }

        let can_message = true;
    
        if (entry.response.json.id != user.id) {
            if (entry.response.json.dm_privacy == 2) {
                can_message = false;
            } else if (entry.response.json.dm_privacy == 1 && entry.response.json.following.filter(x => x.id == user.id).length == 0) {
                can_message = false;
            }
        }

        if (!user.verified) {
            can_message = false;
        }

        entry.response.json.context = {
            following: entry.response.json.followers.filter(x => x.id == user.id).length > 0,
            you: entry.response.json.id == user.id,
            can_message: can_message
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

router.patch("/:userid", async (req, res) => {
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

        let entry = cacheManager.findById(req.params.userid);

        if (entry != null) {
            cacheManager.remove(req.params.userid);
        }

        let profile = await database.getProfileById(req.params.userid);

        if (profile == null) {
            profile = await database.getProfileByUsername(req.params.userid);

            if (profile == null) {
                return res.status(404).json({
                    success: false,
                    message: "Profile not found."
                });
            }
        }

        if (profile.id == user.id) {
            return res.status(401).json({
                success: false,
                message: "You can't do that to yourself!"
            });
        }

        if (profile.bannedUntil != null) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        if (!req.body.action) {
            return res.status(400).json({
                success: false,
                message: "A profile action is required."
            })
        }

        if (req.body.action.toLowerCase() != "follow" && req.body.action.toLowerCase() != "report") {
            return res.status(400).json({
                success: false,
                message: "Invalid profile action. (Valid types are follow, report)"
            })
        }

        if (req.body.action.toLowerCase() == "follow") {
                let following = profile.followers.filter(x => x.id == user.id).length > 0;

                if (!following) {
                    let trylol = await database.followUser(user.id, profile.id);
        
                    if (!trylol) {
                        return res.status(400).json({
                            success: false,
                            message: "Something went wrong while following this user."
                        });
                    }
        
                    return res.status(200).json({
                        result: "followed"
                    });
                } else {
                    let trylol = await database.unfollowUser(user.id, profile.id);
        
                    if (!trylol) {
                        return res.status(400).json({
                            success: false,
                            message: "Something went wrong while unfollowing this user."
                        });
                    }
        
                    return res.status(200).json({
                        result: "unfollowed"
                    });
                }
            }
            else {
                request.post(`https://discord.com/api/webhooks/1158210368271810700/BVCy4PFj7uLnaUWvjtpjpRb6102DztIGNxzOK08vMICuLvGSgobLrPVybckGCwX1nfGa`, {
                    json: true,
                    body: {
                        content: "",
                        username: "OPNIDEA | USER REPORTS",
                        tts: false,
                        embeds: [{
                            title: "User Report!",
                            author: {
                                name: `Submitted by User ID: ${user.id}`,
                            },
                            color: 0xfb0707,
                            fields: [{
                                name: "Profile",
                                value: `https://opnidea.com/profiles/${profile.id}`,
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

router.get("/:userid/posts", async (req, res) => {
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

        let profile = await database.getProfileById(req.params.userid);

        if (profile == null) {
            profile = await database.getProfileByUsername(req.params.userid);

            if (profile == null) {
                return res.status(404).json({
                    success: false,
                    message: "Profile not found."
                });
            }
        }

        if (profile.bannedUntil != null) {
            return res.status(404).json({
                success: false,
                message: "Profile not found."
            });
        }

        let posts = await database.getPosts();

        if (profile.id == user.id) {
            posts = posts.filter(x => x.author.toLowerCase() == profile.id.toLowerCase())
        } else {
            posts = posts.filter(x => x.author.toLowerCase() == profile.id.toLowerCase() && x.privacy == 0)
        }

        return res.status(200).json(posts);
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.get("/:userid/collections", async (req, res) => {
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

        let entry = cacheManager.findById(`${req.params.userid}-collections`);

        if (entry == null) {
            let profile = await database.getProfileById(req.params.userid);

            if (profile == null) {
                profile = await database.getProfileByUsername(req.params.userid);
    
                if (profile == null) {
                    return res.status(404).json({
                        success: false,
                        message: "Profile not found."
                    });
                }
            }
    
            if (profile.bannedUntil != null) {
                return res.status(404).json({
                    success: false,
                    message: "Profile not found."
                });
            }
    
            let collections = await database.getUserCollections(profile.id);
    
            if (profile.id != user.id) {
                collections = collections.filter(x => x.privacy == 0 && x.posts.length > 0);  
            }

            cacheManager.add(`${req.params.userid}-collections`, 200, collections);
    
            return res.status(200).json(collections);
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