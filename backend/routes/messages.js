const express = require('express');
const database = require('../helpers/database');
const checkBan = require('../helpers/general').checkBan;
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

        let messages = await database.getAllMessages(user.id);

        if (messages.length > 0) {
            return res.status(200).json(messages);
        } else {
            return res.status(200).json([]);
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

        let profile = {
            id: "3E1DpnLTn0uem9INZ9N6",
            username: "SYSTEM",
            dm_privacy: 0,
            following: [],
            followers: []
        }

        if (req.params.userid != "0") {
            profile = await database.getProfileById(req.params.userid);

            if (profile == null) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
        }

        let allowed_to_message = true;

        if (profile.dm_privacy == 1 && profile.following.filter(x => x.id == user.id).length == 0) {
            allowed_to_message = false;
        }

        if (profile.dm_privacy == 2) {
            allowed_to_message = false;
        }

        let messages = await database.getMessages(req.params.userid, user.id);
        let secondMessages = await database.getMessages(user.id, req.params.userid);

        if (secondMessages.length > 0) {
            messages.push(...secondMessages);
        }

        if (messages.length > 0) {
            for(var msg of messages) {
                if (!msg.read && msg.author != user.id) {
                    await database.markMessageRead(msg.id);
                }
            }

            messages = messages.sort((a, b) => new Date(b.date) - new Date(a.date));

            messages.reverse();
        }

        if (!allowed_to_message) {
            messages = [];
        }

        return res.status(200).json({
            id: profile.id,
            username: profile.username,
            messaging_privacy: profile.dm_privacy,
            allowed_to_message: allowed_to_message,
            read_only: profile.username == "SYSTEM",
            messages: messages
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

router.post("/:userid", async (req, res) => {
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

        let profile = {
            id: "3E1DpnLTn0uem9INZ9N6",
            username: "SYSTEM",
            dm_privacy: 0,
            following: [],
            followers: []
        }

        if (req.params.userid != 0) {
            profile = await database.getProfileById(req.params.userid);

            if (profile == null) {
                return res.status(404).json({
                    success: false,
                    message: "User not found."
                });
            }
    
            if (profile.dm_privacy == 2) {
                return res.status(401).json({
                    success: false,
                    message: "This user's direct messaging is disabled."
                });
            }
        }

        let allowed_to_message = true;

        if (profile.dm_privacy == 1 && profile.following.filter(x => x.id == user.id).length == 0) {
            allowed_to_message = false;
        }

        if (profile.id == 0) {
            allowed_to_message = false;
        }

        if (!req.body.content) {
            return res.status(401).json({
                success: false,
                message: "A message is required."
            });
        }

        if (req.body.content.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Message must be between 2 and 300 characters in length."
            });
        }

        if (req.body.content.length > 300) {
            return res.status(400).json({
                success: false,
                message: "Message must be between 2 and 300 characters in length."
            });
        }

        if (!allowed_to_message) {
            return res.status(401).json({
                success: false,
                message: "You are not allowed to message this person."
            });
        }

        let message = await database.createMessage(user.id, profile.id, req.body.content);

        return res.status(200).json(message);
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