const express = require('express');
const database = require('../helpers/database');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const router = express.Router();
const fs = require('fs');
const checkBan = require('../helpers/general').checkBan;
const cacheManager = require('../helpers/cacheManager');
const archiver = require('archiver');
const path = require('path');

  function zipFolder(sourceFolderPath, zipFilePath) {
    // Create a write stream to the zip file
    const output = fs.createWriteStream(zipFilePath);
  
    // Create an archiver object
    const archive = archiver('zip', {
      zlib: { level: 9 } // Compression level (0-9)
    });
  
    // Pipe the archive to the output file
    archive.pipe(output);
  
    // Add the entire folder to the archive
    archive.directory(sourceFolderPath, false);
  
    // Finalize the archive and close the write stream
    archive.finalize();
  
    console.log(`Zip file created: ${zipFilePath}`);
  }

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

        let entry = cacheManager.findById(`myself-${user.id}`);

        if (entry == null) {
            let profile = await database.getProfileById(user.id);

            if (profile == null) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication is required."
                });
            }
    
            let preferences = await database.getPreferences(user.id);
    
            if (preferences == null) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication is required."
                });
            }
    
            let pros = [];
    
            if (user.pronouns != "" && user.pronouns != null) {
                pros.push(user.pronouns);
            }

            cacheManager.add(`myself-${user.id}`, 200, {
                id: user.id,
                email: user.email,
                username: user.username,
                bio: user.bio,
                pronouns: pros,
                moderator: user.moderator,
                privacy: user.privacy,
                dm_privacy: user.dm_privacy,
                bannedUntil: user.bannedUntil,
                music_url: user.music_url,
                preferences: preferences,
                verified: user.verified
            });
    
            return res.status(200).json({
                id: user.id,
                email: user.email,
                username: user.username,
                bio: user.bio,
                pronouns: pros,
                moderator: user.moderator,
                privacy: user.privacy,
                dm_privacy: user.dm_privacy,
                bannedUntil: user.bannedUntil,
                music_url: user.music_url,
                preferences: preferences,
                verified: user.verified
            });
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

router.delete("/", async (req, res) => {
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

        let attempt = await database.deleteUser(user.id);

        if (!attempt) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error. Try again later."
            });
        }

        let entry = cacheManager.findById(`myself-${user.id}`);
        let entry2 = cacheManager.findById(user.id);

        if (entry != null) {
            cacheManager.remove(`myself-${user.id}`);
        }

        if (entry2 != null) {
            cacheManager.remove(user.id);
        }

        return res.status(200).json({
            success: true
        })
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.get("/data", async (req, res) => {
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

        delete user.auth;
        delete user.password;

        let posts = await database.getPosts();

        posts = posts.filter(x => x.author.toLowerCase() == user.id.toLowerCase());

        fs.mkdirSync(`./${user.id}`);

        fs.writeFileSync(`./${user.id}/myself.json`, JSON.stringify(user), "utf8");

        fs.mkdirSync(`./${user.id}/posts`);

        for(var post of posts) {
            fs.writeFileSync(`./${user.id}/posts/${post.id}`, JSON.stringify(post));

            for(var attachment of post.attachments) {
                fs.copyFileSync(`../public/files/${attachment.name}`, `./${user.id}/posts/${post.id}-${attachment.name}`)
            }
        }

        zipFolder(`./${user.id}`, `../public/files/${user.id}.zip`);

        return res.status(200).json({
            data_link: `https://opnidea.com/files/${user.id}.zip`
        })
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
})

router.get("/collections", async (req, res) => {
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

        let collections = await database.getUserCollections(user.id);

        return res.status(200).json(collections);
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.post("/collections", async (req, res) => {
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

        if (!req.body.name) {
            return res.status(400).json({
                success: false,
                message: "Collection name is required."
            });
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

        if (!req.body.privacy) {
            return res.status(400).json({
                success: false,
                message: "Privacy state is required."
            });
        }

        let collections = await database.getUserCollections(user.id);

        if (collections.length >= 7) {
            return res.status(400).json({
                success: false,
                message: "Max collections limit reached (7, including 'Your Liked Posts')"
            });
        }

        let collection = await database.createCollection(user.id, req.body.name, req.body.privacy);

        if (collection == null) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error. Try again later."
            });
        }

        return res.status(200).json(collection);    
    }
    catch(error) {
        console.log(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error. Try again later."
        });
    }
});

router.patch("/", upload.fields([{ name: 'avatar' }, { name: 'banner' }]), async (req, res) => {
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

        let profile = await database.getProfileById(user.id);

        if (profile == null) {
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

        let avatar = null;
        let banner = null;
        
        if (req.files['avatar'] && req.files['avatar'].length > 0) {
            avatar = req.files['avatar'][0];
        }
        
        if (req.files['banner'] && req.files['banner'].length > 0) {
            banner = req.files['banner'][0];
        }

        let send_object = {
          music_url: null,
          avatar: (profile.avatar == 'null'  || profile.avatar == null) ? '/files/default_pfp.png' : profile.avatar,
          banner: (profile.banner == 'null'  || profile.banner == null) ? 'default' : profile.banner,
          email: user.email
        };

        if (req.body.avatar != undefined && req.body.avatar != null && req.body.avatar != 'null') {
            send_object.avatar = req.body.avatar;
        }

        if (req.body.banner != undefined && req.body.banner != null && req.body.banner != 'null') {
            send_object.banner = req.body.banner;
        }

        if (req.body.username != undefined) {
            if (req.body.username != user.username) {
                let profile = await database.getProfileByUsername(req.body.username.toLowerCase());

                if (profile != null) {
                    return res.status(400).json({
                        success: false,
                        message: "That username is currently in use. Try another one."
                    });
                }

                if (req.body.username.length < 2 || req.body.username.length > 15) {
                    return res.status(400).json({
                        success: false,
                        message: "Username must be no longer than 15 characters, and no shorter than 2."
                    });
                }

                let isValidUsername = /^[a-zA-Z0-9]+$/.test(req.body.username.toLowerCase());

                if (!isValidUsername) {
                    return res.status(400).json({
                        success: false,
                        message: "Username must contain only English letters and numbers."
                    });
                }
    
                send_object.username = req.body.username.toLowerCase();
            }
        }

        if (req.body.dm_privacy != undefined && req.body.dm_privacy != user.dm_privacy) {
            send_object.dm_privacy = req.body.dm_privacy;
        }

        if (req.body.email != undefined && req.body.email != null && req.body.email != "null" && req.body.email != user.email && req.body.email.length > 5 && req.body.email.includes("@")) {
            send_object.email = req.body.email;
        }

        if (req.body.privacy != undefined && req.body.privacy != user.privacy) {
            send_object.privacy = req.body.privacy;
        }

        if (req.body.pronouns != undefined && req.body.pronouns != user.pronouns) {
            send_object.pronouns = req.body.pronouns;
        }

        if (req.body.music_url && req.body.music_url != user.music_url) {
            send_object.music_url = req.body.music_url;
        }
        
        if (send_object.music_url == 'null') {
            send_object.music_url = null;
        }

        if (req.body.bio != undefined && req.body.bio != null && req.body.bio != "null" && req.body.bio != user.bio) {
            if (req.body.bio.length > 50) {
                return res.status(400).json({
                    success: false,
                    message: "Bio must be no longer than 50 characters."
                });
            }
            
            send_object.bio = req.body.bio;
        }

        if (send_object.music_url != "" && send_object.music_url != null && send_object.music_url != 'null' && !req.body.music_url.endsWith(".mp3") && !req.body.music_url.endsWith(".ogg")) {
            return res.status(400).json({
                success: false,
                message: "A valid user update object is required. (Parameters are username, email, new_password, old_password, privacy, music_url, avatar)"
            });
        }

        if (avatar != null && avatar != undefined) {
            let allowed_extensions = [
                ".png",
                ".jpg",
                ".gif",
                ".webp"
            ]

            let extension = path.extname(avatar.originalname);

            if (!allowed_extensions.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    message: "That file extension isn't supported. (Supported types: .png, .jpg, .gif, .webp)"
                });
            }

            var link = `${Date.now() + Math.round(Math.random() * 1E9)}${extension}`;

            fs.writeFileSync(`../public/files/${link}`, avatar.buffer);

            send_object.avatar = `/files/${link}`;
        }

        if (banner != null && banner != undefined) {
            let allowed_extensions = [
                ".png",
                ".jpg",
                ".gif",
                ".webp"
            ]

            let extension = path.extname(banner.originalname);

            if (!allowed_extensions.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    message: "That file extension isn't supported. (Supported types: .png, .jpg, .gif, .webp)"
                });
            }

            var link = `${Date.now() + Math.round(Math.random() * 1E9)}${extension}`;

            fs.writeFileSync(`../public/files/${link}`, banner.buffer);

            send_object.banner = `/files/${link}`;
        }

        if (req.body.new_password != undefined && req.body.old_password != undefined) {
            send_object.new_password = req.body.new_password;
            send_object.old_password = req.body.old_password;

            let pw_hash = await database.getPwHash(user.id);

            if (pw_hash == null) {
                return res.status(400).json({
                    success: false,
                    message: "A valid user update object is required. (Parameters are username, email, new_password, old_password, privacy, music_url, avatar)"
                });
            }

            if (!database.compare(send_object.old_password, pw_hash)) {
                return res.status(400).json({
                    success: false,
                    message: "Old password isn't correct"
                });
            }
        }

        let attempt = await database.updateSelf(user.id, send_object);

        if (attempt) {
            let entry = cacheManager.findById(`myself-${user.id}`);
            let entry2 = cacheManager.findById(user.id);
    
            if (entry != null) {
                cacheManager.remove(`myself-${user.id}`);
            }
    
            if (entry2 != null) {
                cacheManager.remove(user.id);
            }

            return res.status(200).json({
                success: true
            });
        } else {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while updating your account. Try again later."
            })
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

router.patch("/preferences", async (req, res) => {
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

        let preferences = await database.getPreferences(user.id);

        if (preferences == null) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while updating your preferences. Try again later."
            })
        }

        let object = req.body.object;

        if (!object) {
            return res.status(400).json({
                success: false,
                message: "A valid preferences update object is required. (Parameters are music_enabled, music_volume)"
            });
        }

        let send_object = {
            music_enabled: preferences.music_enabled,
            comments_enabled: preferences.comments_enabled,
            music_volume: preferences.music_volume.toString()
        };

        if (object.music_enabled != undefined) {
            send_object.music_enabled = object.music_enabled;
        }

        if (object.music_volume != undefined) {
            send_object.music_volume = object.music_volume.toString();
        }

        if (object.comments_enabled != undefined) {
            send_object.comments_enabled = object.comments_enabled;
        }

        let attempt = await database.updatePreferences(user.id, send_object);

        if (attempt) {
            let entry = cacheManager.findById(`myself-${user.id}`);
    
            if (entry != null) {
                cacheManager.remove(`myself-${user.id}`);
            }
            
            return res.status(200).json({
                music_enabled: send_object.music_enabled,
                music_volume: parseFloat(send_object.music_volume.toString()),
                comments_enabled: send_object.comments_enabled
            })
        } else {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while updating your preferences. Try again later."
            })
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

module.exports = router;