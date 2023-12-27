const { Pool } = require("pg");
const bcrypt = require("bcrypt");
const fs = require("fs");
const jwt = require("jsonwebtoken");
const generateString = require("./general.js").generateString;
const sendRegistrationEmail = require("./general.js").sendRegistrationEmail;
const sendPwEmail = require('./general.js').sendPwEmail;

const configuration = {
    user: 'postgres',
    host: 'localhost',
    database: 'opnidea',
    password: 'redacted',
    port: 5432
}

const pool = new Pool(configuration);

const database = {
    client: null,
    async runQuery(queryString, values) {
        if (database.client == null) {
            database.client = await pool.connect();
            database.client.on('error', () => {});
            database.client.connection.on('error', () => {});
        }
        
        try {
            const query = {
                text: queryString,
                values: values
            };

            const result = await database.client.query(query);
            const rows = result.rows;

            if (rows.length === 0) {
                return null;
            }
    
            return rows;
        } catch (error) {
            console.log(error);

            return null;
        }
    },
    async setupDatabase() {
        try {
            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    username TEXT,
                    email TEXT,
                    password TEXT,
                    auth TEXT,
                    avatar TEXT,
                    banner TEXT DEFAULT NULL,
                    bio TEXT DEFAULT NULL,
                    moderator INTEGER DEFAULT 0,
                    pronouns TEXT DEFAULT NULL,
                    bannedUntil TEXT DEFAULT NULL,
                    privacy INTEGER DEFAULT 0,
                    message_privacy INTEGER DEFAULT 0,
                    badges TEXT DEFAULT NULL,
                    verified INTEGER DEFAULT 0,
                    verificationlink TEXT DEFAULT NULL,
                    music_url TEXT DEFAULT NULL,
                    followers TEXT DEFAULT NULL,
                    following TEXT DEFAULT NULL
                );
            `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS comments (
                    id TEXT,
                    author TEXT,
                    date TEXT,
                    content TEXT
                );
            `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS messages (
                    id TEXT PRIMARY KEY,
                    from_user TEXT,
                    to_user TEXT,
                    content TEXT,
                    date TEXT,
                    time TEXT,
                    read INTEGER DEFAULT 0
                );
            `, []);

            await database.runQuery(`
            CREATE TABLE IF NOT EXISTS censored_attachments (
                id TEXT PRIMARY KEY,
                from_user TEXT,
                to_user TEXT,
                content TEXT,
                priority INTEGER DEFAULT 0
            );
        `, []);

            await database.runQuery(`
            CREATE TABLE IF NOT EXISTS copyright_complaints (
                id TEXT PRIMARY KEY,
                from_user TEXT,
                date TEXT,
                content TEXT
            );
        `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS categories (
                    name TEXT,
                    official INTEGER DEFAULT 0
                );
            `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS posts (
                    id TEXT,
                    author TEXT,
                    caption TEXT,
                    date TEXT,
                    in_category TEXT,
                    collections INTEGER DEFAULT 0,
                    likes INTEGER DEFAULT 0,
                    privacy INTEGER DEFAULT 0,
                    comments INTEGER DEFAULT 0
                );
            `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS collections (
                    id TEXT PRIMARY KEY,
                    author_id TEXT,
                    name TEXT,
                    posts TEXT DEFAULT NULL,
                    privacy INTEGER DEFAULT 0
                );
            `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS preferences (
                    id TEXT PRIMARY KEY,
                    profile_music INTEGER DEFAULT 1,
                    music_volume TEXT DEFAULT '0.03',
                    comments INTEGER DEFAULT 1
                );
            `, []);

            await database.runQuery(`
                CREATE TABLE IF NOT EXISTS attachments (
                    id TEXT,
                    file_name TEXT,
                    original_file_name TEXT,
                    link TEXT,
                    file_width INTEGER DEFAULT 0,
                    file_height INTEGER DEFAULT 0,
                    file_size INTEGER DEFAULT 0
                );
            `, []);

            let categories = await this.getOfficialCategories();

            if (categories.length == 0) {
                await this.createOfficialCategory("art");
                await this.createOfficialCategory("irl");
                await this.createOfficialCategory("music");
                await this.createOfficialCategory("anime");
            }
        }
        catch { }
    },
    async register(email, password) {
        try {
            var users = await database.runQuery(`SELECT * FROM users WHERE email = $1`, [email]);
    
            if (users != null && users.length > 0) {
                return {
                    success: false,
                    message: "Email is already registered."
                }
            }
    
            var salt = await bcrypt.genSalt(10);
            var hash = await bcrypt.hash(password, salt);
            var id = generateString(20);
            var username = `opnusr_${generateString(8)}`
    
            var shit = `${Buffer.from(id).toString("base64")}-${Buffer.from(email).toString("base64")}-${hash}`;
            var key = `${jwt.sign(shit, "OPNIDEA_PRODUCTION16092023$42!x")}`;
            //var code = `${generateString(50)}`;

            //await sendRegistrationEmail(email, `https://opnidea.com/email-verification?passoffcode=${code}`); -- temp disabled
                
            //await database.runQuery(`INSERT INTO users (id, username, email, password, auth, avatar, bio, banner, moderator, pronouns, bannedUntil, privacy, badges, verified, verificationlink, music_url, followers, following) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`, [id, username, email, hash, key, '/files/default_pfp.png', 'NULL', 'NULL', 0, 'NULL', 'NULL', 0, 'NULL', 0, `https://opnidea.com/email-verification?passoffcode=${code}`, 'NULL', 'NULL', 'NULL']);
            await database.runQuery(`INSERT INTO users (id, username, email, password, auth, avatar, bio, banner, moderator, pronouns, bannedUntil, privacy, badges, verified, verificationlink, music_url, followers, following) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)`, [id, username, email, hash, key, '/files/default_pfp.png', 'NULL', 'NULL', 0, 'NULL', 'NULL', 0, 'NULL', 1, `NULL`, 'NULL', 'NULL', 'NULL']);
            await database.runQuery(`INSERT INTO collections (id, author_id, name, posts, privacy) VALUES ($1, $2, $3, $4, $5)`, [id, id, 'Your Liked Posts', 'NULL', 2]);
            await database.runQuery(`INSERT INTO preferences (id, profile_music, music_volume) VALUES ($1, $2, $3)`, [id, 1, '0.03']);

            return {
                success: true,
                key: key
            };
        }
        catch (error) {
            console.log(error);

            return {
                success: false,
                message: "Something went wrong while creating your account."
            }
        }
    },
    async verifyUser(code) {
        try {
            var users = await database.runQuery(`SELECT * FROM users WHERE verificationlink = $1`, [`https://opnidea.com/email-verification?passoffcode=${code}`]);
    
            if (users == null || users.length == 0) {
                return false;
            }     
                
            await database.runQuery(`UPDATE users SET verificationlink = $1, verified = $2 WHERE id = $3`, ['NULL', 1, users[0].id]);

            return true;
        }
        catch (error) {
            console.log(error);

            return false;
        }
    },
    async login(email, password) {
        try {
            var users = await database.runQuery(`SELECT * FROM users WHERE email = $1`, [email]);

            if (users == null || users.length == 0) {
                return {
                    success: false,
                    message: "Email and/or password is invalid."
                }
            }

            var user = users[0];

            var comparison = bcrypt.compareSync(password, user.password);

            if (!comparison) {
                return {
                    success: false,
                    message: "Email and/or password is invalid."
                }
            }

            return {
                success: true,
                key: user.auth
            }
        }
        catch(error) {
            console.log(error);

            return {
                success: false,
                message: "Something went wrong while logging into your account."
            }
        }
    },
    async getPreferences(user_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM preferences WHERE id = $1`, [user_id]);

            if (rows == null || rows.length == 0) {
                return null;
            }

            return {
                music_enabled: rows[0].profile_music == 1 ? true : false,
                music_volume: parseFloat(rows[0].music_volume.toString()),
                comments_enabled: rows[0].comments == 1 ? true : false
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async banUser(user_id, date) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let iso = date;

            if (date != 'never') {
                iso = date.toISOString();
            }

            await database.runQuery(`UPDATE users SET bannedUntil = $1 WHERE id = $2`, [iso, user_id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async unbanUser(user_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            await database.runQuery(`UPDATE users SET bannedUntil = $1 WHERE id = $2`, ['NULL', user_id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async getAllMessages(user_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM messages WHERE to_user = $1`, [user_id]);

            if (rows == null || rows.length == 0) {
                return [];
            }

            let ret = [];
            let messages = [];

            let row = rows[rows.length - 1];

            messages.push({
                id: row.id,
                content: row.content,
                date: row.date,
                time: row.time,
                read: row.read == 1 ? true : false,
                author: row.from_user
            });

            for(var row_2 of rows) {
                let profile = await database.getProfileById(row_2.from_user);

                if (profile == null && row_2.from_user == '0') {
                    profile = {
                        id: "3E1DpnLTn0uem9INZ9N6",
                        username: "SYSTEM",
                        moderator: true,
                        dm_privacy: 0,
                        following: [],
                        followers: []
                    }
                }

                let mes = rows.filter(x => x.from_user == row_2.from_user);

                let msg = mes[mes.length - 1];

                let mesa = [];

                mesa.push(msg);

                if (profile != null && ret.filter(x => x.from.id == row_2.from_user).length == 0) {
                    ret.push({
                        from: {
                            id: row_2.from_user,
                            username: profile.username,
                            verified: profile.moderator
                        },
                        messages: mesa
                    })
                }
            }

            return ret;
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async createMessage(author_id, receiver_id, content) {
        try {
            var author = await this.getUserById(author_id);
    
            if (author == null) {
                return null;
            }

            var receiver = await this.getUserById(receiver_id);

            if (receiver == null) {
                return null;
            }

            var message_id = generateString(20);
            var date = new Date();
            var hours = date.getHours();
            var minutes = date.getMinutes();
 
            var amOrPm = hours >= 12 ? 'PM' : 'AM';

            if (hours > 12) {
                hours -= 12;
            }

            if (minutes < 10) {
                minutes = '0' + minutes;
            }

            var formattedTime = hours + ':' + minutes + ' ' + amOrPm;
            var formattedDate = date.toISOString();
                
            await database.runQuery(`INSERT INTO messages (id, from_user, to_user, content, date, time, read) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [message_id, author_id, receiver_id, content, formattedDate, formattedTime, 0]);

            return {
                content: content,
                read: 0,
                date: formattedDate,
                time: formattedTime,
                author: author_id
            };
        }
        catch (error) {
            console.log(error);

            return null;
        }
    },
    async getMessages(from_user, to_user) {
        try {
            const rows = await database.runQuery(`SELECT * FROM messages WHERE from_user = $1 AND to_user = $2`, [from_user, to_user]);

            if (rows == null || rows.length == 0) {
                return [];
            }

            let messages = [];

            for(var row of rows) {
                messages.push({
                    id: row.id,
                    content: row.content,
                    read: row.read == 1 ? true : false,
                    date: row.date,
                    time: row.time,
                    author: (row.from_user == from_user) ? row.from_user : row.to_user
                })
            }

            return messages;
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async markMessageRead(message_id) {
        try {
            await database.runQuery(`UPDATE messages SET read = $1 WHERE id = $2`, [1, message_id]);

            return true;
        }
        catch(error) {
            return false;
        }
    },
    async updatePreferences(user_id, object) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let preferences = await this.getPreferences(user_id);

            if (preferences == null) {
                return false;
            }

            let update_object = {
                music_enabled: preferences.music_enabled == true ? 1 : 0,
                comments_enabled: preferences.comments_enabled == true ? 1 : 0,
                music_volume: preferences.music_volume
            };

            if (object.music_enabled != undefined && object.music_enabled != preferences.music_enabled) {
                update_object.music_enabled = object.music_enabled == true ? 1 : 0;
            }

            if (object.music_volume != undefined && object.music_volume != preferences.music_volume) {
                update_object.music_volume = object.music_volume.toString();
            }

            if (object.comments_enabled != undefined && object.comments_enabled != preferences.comments_enabled) {
                update_object.comments_enabled = object.comments_enabled == true ? 1 : 0;
            }

            await database.runQuery(`UPDATE preferences SET profile_music = $1, music_volume = $2, comments = $3 WHERE id = $4`, [update_object.music_enabled, update_object.music_volume.toString(), update_object.comments_enabled, user_id]);

            return true;
        }
        catch(error) {
            console.log(error);
            return false;
        }
    },
    async submitCopyrightComplaint(user_id, content) {
        try {
            let user = await database.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let id = generateString(20);
            let date = new Date().toISOString();

            await database.runQuery(`INSERT INTO copyright_complaints (id, from_user, date, content) VALUES ($1, $2, $3, $4)`, [id, user_id, date, content]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async addComment(user_id, post_id, comment) {
        try {
            let user = await database.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let post = await database.getPostById(post_id);

            if (post == null) {
                return false;
            }

            let date = new Date().toISOString();

            await database.runQuery(`INSERT INTO comments (id, author, date, content) VALUES ($1, $2, $3, $4)`, [post_id, user_id, date, comment]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async getUserById(user_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE id = $1`, [user_id]);
            if (rows != null && rows.length > 0) {
                return {
                    avatar: (rows[0].avatar == 'NULL' || rows[0].avatar == 'null') ? '/files/default_pfp.png' : rows[0].avatar,
                    bio: rows[0].bio == 'NULL' ? null : rows[0].bio,
                    id: rows[0].id,
                    username: rows[0].username,
                    email: rows[0].email,
                    moderator: rows[0].moderator == 1 ? true : false,
                    bannedUntil: rows[0].bannedUntil == 'NULL' ? null : rows[0].bannedUntil,
                    music_url: rows[0].music_url == 'NULL' ? null : rows[0].music_url,
                    privacy: rows[0].privacy,
                    dm_privacy: rows[0].message_privacy,
                    pronouns: rows[0].pronouns == 'NULL' ? null : rows[0].pronouns
                };
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async getUserByUsername(user_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE username = $1`, [user_id]);
            if (rows != null && rows.length > 0) {
                return {
                    avatar: (rows[0].avatar == 'NULL' || rows[0].avatar == 'null') ? '/files/default_pfp.png' : rows[0].avatar,
                    bio: rows[0].bio == 'NULL' ? null : rows[0].bio,
                    id: rows[0].id,
                    username: rows[0].username,
                    moderator: rows[0].moderator == 1 ? true : false,
                    bannedUntil: rows[0].bannedUntil == 'NULL' ? null : rows[0].bannedUntil,
                    music_url: rows[0].music_url == 'NULL' ? null : rows[0].music_url,
                    privacy: rows[0].privacy,
                    dm_privacy: rows[0].message_privacy,
                    pronouns: rows[0].pronouns == 'NULL' ? null : rows[0].pronouns
                };
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async getProfileByUsername(username) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE username = $1`, [username]);

            if (rows != null && rows.length > 0) {
                let followers = [];

                for(var follower of rows[0].followers.split(':')) {
                    if (follower.length > 2) {
                        let user = await this.getUserById(follower);

                        if (user != null && user.id != rows[0].id && followers.filter(x => x.id == user.id).length == 0) {
                            delete user.email;

                            followers.push(user);
                        }
                    }
                }

                let following = [];

                for(var follow of rows[0].following.split(':')) {
                    if (follow.length > 2) {   
                        let user = await this.getUserById(follow);

                        if (user != null && user.id != rows[0].id && following.filter(x => x.id == user.id).length == 0) {
                            delete user.email;

                            following.push(user);
                        }
                    }
                }

                let badges = [];

                for(var badge of rows[0].badges.split(':')) {
                    if (parseInt(badge) == 1) {
                        badges.push("founder");
                    } else if (parseInt(badge) == 2) {
                        badges.push("verified")
                    } else if (parseInt(badge) == 3) {
                        badges.push("contributor")
                    }
                }

                return {
                    avatar: (rows[0].avatar == 'NULL' || rows[0].avatar == 'null') ? '/files/default_pfp.png' : rows[0].avatar,
                    bio: rows[0].bio == 'NULL' ? null : rows[0].bio,
                    banner: rows[0].banner == 'NULL' ? null : rows[0].banner,
                    id: rows[0].id,
                    username: rows[0].username,
                    moderator: rows[0].moderator == 1 ? true : false,
                    bannedUntil: rows[0].bannedUntil == 'NULL' ? null : rows[0].bannedUntil,
                    privacy: rows[0].privacy,
                    dm_privacy: rows[0].message_privacy,
                    music_url: rows[0].music_url == 'NULL' ? null : rows[0].music_url,
                    pronouns: rows[0].pronouns == 'NULL' ? null : rows[0].pronouns,
                    badges: badges,
                    followers: followers,
                    following: following
                };
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async getProfileById(profile_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE id = $1`, [profile_id]);

            if (rows != null && rows.length > 0) {
                let followers = [];

                for(var follower of rows[0].followers.split(':')) {
                    if (follower.length > 2) {
                        let user = await this.getUserById(follower);

                        if (user != null && user.id != rows[0].id && followers.filter(x => x.id == user.id).length == 0) {
                            delete user.email;

                            followers.push(user);
                        }
                    }
                }

                let following = [];

                for(var follow of rows[0].following.split(':')) {
                    if (follow.length > 2) {   
                        let user = await this.getUserById(follow);

                        if (user != null && user.id != rows[0].id && following.filter(x => x.id == user.id).length == 0) {
                            delete user.email;

                            following.push(user);
                        }
                    }
                }

                let badges = [];

                for(var badge of rows[0].badges.split(':')) {
                    if (parseInt(badge) == 1) {
                        badges.push("founder");
                    } else if (parseInt(badge) == 2) {
                        badges.push("verified")
                    } else if (parseInt(badge) == 3) {
                        badges.push("contributor")
                    }
                }

                return {
                    avatar: (rows[0].avatar == 'NULL' || rows[0].avatar == 'null') ? '/files/default_pfp.png' : rows[0].avatar,
                    id: rows[0].id,
                    bio: rows[0].bio == 'NULL' ? null : rows[0].bio,
                    banner: rows[0].banner == 'NULL' ? null : rows[0].banner,
                    username: rows[0].username,
                    moderator: rows[0].moderator == 1 ? true : false,
                    bannedUntil: rows[0].bannedUntil == 'NULL' ? null : rows[0].bannedUntil,
                    privacy: rows[0].privacy,
                    dm_privacy: rows[0].message_privacy,
                    music_url: rows[0].music_url == 'NULL' ? null : rows[0].music_url,
                    pronouns: rows[0].pronouns == 'NULL' ? null : rows[0].pronouns,
                    badges: badges,
                    followers: followers,
                    following: following
                };
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async getOfficialCategories() {
        try {
            const rows = await database.runQuery(`SELECT * FROM categories WHERE official = $1`, [1]);
            const ret = [];

            if (rows != null && rows.length > 0) {
                for(var row of rows) {
                    ret.push(row.name.toLowerCase());
                }

                return ret;
            } else {
                return [];
            }
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async getUnOfficialCategories() {
        try {
            const rows = await database.runQuery(`SELECT * FROM categories WHERE official = $1`, [0]);
            const ret = [];

            if (rows != null && rows.length > 0) {
                for(var row of rows) {
                    ret.push(row.name.toLowerCase());
                }

                return ret;
            } else {
                return [];
            }
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async createUnofficialCategory(name) {
        try {
            let existing = await this.getUnOfficialCategories();

            if (existing.includes(name.toLowerCase())) {
                return null;
            }

            await database.runQuery(`INSERT INTO categories (name, official) VALUES ($1, $2)`, [name, 0]);
        }
        catch(error) {
            return null;
        }
    },
    async createOfficialCategory(name) {
        try {
            let existing = await this.getOfficialCategories();

            if (existing.includes(name.toLowerCase())) {
                return null;
            }

            await database.runQuery(`INSERT INTO categories (name, official) VALUES ($1, $2)`, [name, 1]);
        }
        catch(error) {
            return null;
        }
    },
    async followUser(user_id, profile_id) {
        try {
            let profile = await this.getProfileById(profile_id);

            if (profile == null) {
                return false;
            }

            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let our_profile = await this.getProfileById(user_id);

            if (our_profile == null) {
                return false;
            }

            let current_followers = "";
            let current_following = "";

            for(var follower of profile.followers) {
                current_followers += `${follower.id}:`
            }

            current_followers = current_followers.replace(/:([^:]*)$/, '$1');

            for(var follow of profile.following) {
                current_following += `${follow.id}:`
            }

            current_following = current_following.replace(/:([^:]*)$/, '$1');
            
            current_followers += `:${user_id}`
            current_following += `:${profile_id}`

            await database.runQuery(`UPDATE users SET following = $1 WHERE id = $2`, [current_following, user_id]);
            await database.runQuery(`UPDATE users SET followers = $1 WHERE id = $2`, [current_followers, profile_id]);

            return true;
        }
        catch(error) {
            console.log(error);
            return false;
        }
    },
    async getStats() {
        try {
            let posts = await database.getPosts();
            let users = await database.runQuery(`SELECT * FROM USERS`);
            let attachments = await database.runQuery(`SELECT * FROM attachments`);

            let users_registered = users.length;
            let posts_made = posts.length;
            let size_used = 0;
            let attachments_exist = attachments.length;
            let fallen_users = 0;
            let moderators_assigned = 0;
            let attachments_censored = 0;

            for(var post of attachments) {
                size_used = size_used + post.file_size;
            }

            for(var user of users) {
                if (user.banneduntil != 'NULL') {
                    fallen_users = fallen_users + 1;
                }

                if (user.moderator == 1) {
                    moderators_assigned = moderators_assigned + 1;
                }
            }

            size_used = size_used / Math.pow(10, 9);

            return {
                users_registered: users_registered,
                posts_made: posts_made,
                size_used: `${size_used}GB`,
                attachments_exist: attachments_exist,
                fallen_users: fallen_users,
                moderators_assigned: moderators_assigned,
                attachments_censored: attachments_censored
            }
        }
        catch(error) {
            console.log(error);
            return null;
        }
    },
    async getPwHash(user_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE id = $1`, [user_id]);

            if (rows.length == 0 || rows == null) {
                return null;
            }

            return rows[0].password;
        }
        catch(error) {
            console.log(error);
            return null;
        }
    },
    compare(str, pw_hash) {
        return bcrypt.compareSync(str, pw_hash);
    },
    async updateSelf(user_id, object) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let update_object = {
                username: user.username,
                email: user.email,
                music_url: user.music_url,
                privacy: user.privacy,
                avatar: user.avatar,
                banner: user.banner,
                pronouns: user.pronouns,
                dm_privacy: user.dm_privacy,
                bio: user.bio
            };

            if (object.username != null && object.username.length >= 2 && object.username.length < 15) {
                update_object.username = object.username.toLowerCase();
            }

            if (object.email != null) {
                update_object.email = object.email;
            }

            if (object.dm_privacy != null) {
                update_object.dm_privacy = object.dm_privacy;
            }

            if (object.avatar != null) {
                update_object.avatar = object.avatar;
            }

            if (object.avatar == 'default') {
                update_object.avatar = '/files/default_pfp.png';
            }

            if (object.banner != null) {
                update_object.banner = object.banner;
            }

            if (object.banner == 'default') {
                update_object.banner = 'NULL';
            }

            if (object.bio != null) {
                update_object.bio = object.bio;
            }

            if (object.pronouns != null) {
                update_object.pronouns = object.pronouns;
            }

            if (object.new_password && object.new_password != null && object.new_password != undefined) {
                var salt = await bcrypt.genSalt(10);
                var hash = await bcrypt.hash(object.new_password, salt);
        
                var shit = `${Buffer.from(user_id).toString("base64")}-${Buffer.from(update_object.email).toString("base64")}-${hash}`;
                var key = `${jwt.sign(shit, "OPNIDEA_PRODUCTION16092023$42!x")}`;

                await database.runQuery(`UPDATE users SET auth = $1, password = $2 WHERE id = $3`, [key, hash, user_id]); 
            }

            if (object.music_url != null) {
                update_object.music_url = object.music_url;
            }

            if (object.privacy != null) {
                update_object.privacy = object.privacy;
            }

            let privacy_type = 0;

            if (update_object.privacy && update_object.privacy.toLowerCase() == "semi-public") {
                privacy_type = 1;
            } else if (update_object.privacy && update_object.privacy.toLowerCase() == "private") {
                privacy_type = 2;
            }

            let dm_privacy_type = 0;

            if (update_object.dm_privacy && update_object.dm_privacy.toLowerCase() == "following") {
                dm_privacy_type = 1;
            } else if (update_object.dm_privacy && update_object.dm_privacy.toLowerCase() == "noone") {
                dm_privacy_type = 2;
            }

            await database.runQuery(`UPDATE users SET username = $1, email = $2, privacy = $3, music_url = $4, avatar = $5, banner = $6, bio = $7, pronouns = $8, message_privacy = $9 WHERE id = $10`, [update_object.username.toLowerCase(), update_object.email, privacy_type, update_object.music_url == null ? 'NULL' : update_object.music_url, update_object.avatar, update_object.banner, update_object.bio, update_object.pronouns == null ? 'NULL' : update_object.pronouns, dm_privacy_type, user_id]);
            
            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async unfollowUser(user_id, profile_id) {
        try {
            let profile = await this.getProfileById(profile_id);

            if (profile == null) {
                return false;
            }

            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let our_profile = await this.getProfileById(user_id);

            if (our_profile == null) {
                return false;
            }

            let current_followers = "";
            let current_following = "";

            for(var follower of profile.followers) {
                current_followers += `${follower.id}:`
            }

            current_followers = current_followers.replace(/:([^:]*)$/, '$1');

            for(var follow of profile.following) {
                current_following += `${follow.id}:`
            }

            current_following = current_following.replace(/:([^:]*)$/, '$1');
            
            current_followers = current_followers.replace(`:${user_id}`, ``);
            current_followers = current_followers.replace(`${user_id}`, ``);
            current_following = current_following.replace(`:${profile_id}`, ``);
            current_following = current_following.replace(`${profile_id}`, ``);

            await database.runQuery(`UPDATE users SET following = $1 WHERE id = $2`, [current_following, user_id]);
            await database.runQuery(`UPDATE users SET followers = $1 WHERE id = $2`, [current_followers, profile_id]);

            return true;
        }
        catch(error) {
            console.log(error);
            return false;
        }
    },
    async likePost(user_id, post_id) {
        try {
            let post = await this.getPostById(post_id);

            if (post == null) {
                return false;
            }

            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let collections = await this.getCollections();

            let liked_collection = collections.filter(x => x.id == user_id)[0];

            if (!liked_collection) {
                return false;
            }

            let current_likes = post.likes;

            current_likes++;
            
            await database.runQuery(`UPDATE posts SET likes = $1 WHERE id = $2`, [current_likes, post_id]);

            let attempt = await database.addToCollection(user_id, user_id, post_id);

            if (!attempt) {
                return false;
            }

            return true;
        }
        catch(error) {
            console.log(error);
            return false;
        }
    },
    async unlikePost(user_id, post_id) {
        try {
            let post = await this.getPostById(post_id);

            if (post == null) {
                return false;
            }

            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let collections = await this.getCollections();

            let liked_collection = collections.filter(x => x.id == user_id)[0];

            if (!liked_collection) {
                return false;
            }

            let current_likes = post.likes;

            current_likes--;

            if (current_likes < 0) {
                current_likes = 0;
            }
            
            await database.runQuery(`UPDATE posts SET likes = $1 WHERE id = $2`, [current_likes, post_id]);

            let attempt = await database.removeFromCollection(user_id, user_id, post_id);

            if (!attempt) {
                return false;
            }

            return true;
        }
        catch(error) {
            console.log(error);
            return false;
        }
    },
    async getCollections() {
        try {
            const rows = await database.runQuery(`SELECT * FROM collections`);
            const ret = [];

            if (rows != null && rows.length > 0) {
                for(var row of rows) {
                    let posts = [];

                    if (row.posts.split(':').length > 0) {
                        for(var post_id of row.posts.split(':')) {
                            let post = await this.getPostById(post_id);
    
                            if (post != null) {
                                posts.push(post);
                            }
                        }
                    }

                    ret.push({
                        id: row.id,
                        author_id: row.author_id,
                        name: row.name,
                        posts: posts,
                        privacy: row.privacy
                    });
                }

                return ret;
            } else {
                return [];
            }
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async getUserCollections(user_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return [];
            }

            let collections = await this.getCollections();

            collections = collections.filter(x => x.author_id == user.id);

            return collections;
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async getPostsCollections(post_id) {
        try {
            let collections = await this.getCollections();
            let ret = [];

            for(var collection of collections) {
                if (collection.posts.filter(y => y.id == post_id).length > 0) {
                    ret.push({
                        id: collection.id,
                        name: collection.name,
                        posts: collection.posts,
                        privacy: collection.privacy
                    })
                }
            }
            
            return ret;
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async addToCollection(user_id, collection_id, post_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let real_post = await this.getPostById(post_id);

            if (real_post == null) {
                return false;
            }

            let user_collections = await this.getUserCollections(user_id);

            if (user_collections.length == 0) {
                return false;
            }

            let collection = user_collections.find(x => x.id == collection_id);

            if (!collection) {
                return false;
            }

            if (collection.posts.filter(x => x.id == post_id).length > 0) {
                return false;
            }

            collection.posts.push(real_post);

            let updateStr = '';

            for(var collection_post of collection.posts) {
                updateStr += `${collection_post.id}:`;
            }

            updateStr = updateStr.replace(/:([^:]*)$/, '$1');

            await database.runQuery(`UPDATE collections SET posts = $1 WHERE id = $2`, [updateStr, collection_id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async removeFromCollection(user_id, collection_id, post_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let real_post = await this.getPostById(post_id);

            if (real_post == null) {
                return false;
            }

            let user_collections = await this.getUserCollections(user_id);

            if (user_collections.length == 0) {
                return false;
            }

            let collection = user_collections.find(x => x.id == collection_id);

            if (!collection) {
                return false;
            }

            if (!collection.posts.find(x => x.id == post_id)) {
                return false;
            }

            collection.posts.splice(collection.posts.indexOf(real_post), 1);

            let updateStr = '';

            for(var collection_post of collection.posts) {
                updateStr += `${collection_post.id}:`;
            }

            updateStr = updateStr.replace(/:([^:]*)$/, '$1');

            await database.runQuery(`UPDATE collections SET posts = $1 WHERE id = $2`, [updateStr, collection_id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async deleteCollection(user_id, collection_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let user_collections = await this.getUserCollections(user_id);

            if (user_collections.length == 0) {
                return false;
            }

            let collection = user_collections.find(x => x.id == collection_id);

            if (!collection) {
                return false;
            }

            await database.runQuery(`DELETE FROM collections WHERE id = $1`, [collection_id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async deletePost(user_id, post_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let post = await this.getPostById(post_id);

            if (post == null) {
                return false;
            }

            if (post.author.id != user_id) {
                return false;
            }

            let attachments = await database.runQuery(`SELECT * FROM attachments WHERE id = $1`, [post_id]);

            await database.runQuery(`DELETE FROM posts WHERE id = $1`, [post_id]);

            if (attachments != null && attachments.length > 0) {
                for (var attachment of attachments) {
                    await database.runQuery(`DELETE FROM attachments WHERE id = $1`, [post_id]);

                    if (fs.existsSync(`.../public/files/${attachment.name}`)) {
                        fs.deleteSync((`.../public/files/${attachment.name}`));
                    }
                }
            }

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async deleteUser(user_id) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let posts = await this.getPosts();

            posts = posts.filter(x => x.author.id == user_id);

            for(var post of posts) {
                for(var attachment of post.attachments) {
                    if (fs.existsSync(`.../public/files/${attachment.name}`)) {
                        fs.deleteSync((`.../public/files/${attachment.name}`));
                    }
                }

                await database.runQuery(`DELETE FROM posts WHERE id = $1`, [post.id]);
            }

            await database.runQuery(`DELETE FROM users WHERE id = $1`, [user_id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async getPosts() {
        try {
            const rows = await database.runQuery(`SELECT * FROM posts`);

            if (rows != null && rows.length > 0) {
                const ret = [];

                for(var row of rows) {
                    let attachments = await this.getPostAttachments(row.id);
                    let author = await this.getUserById(row.author);

                    if (attachments.length > 0 && author != null) {
                        ret.push({
                            id: row.id,
                            author: row.author,
                            caption: row.caption,
                            date: row.date,
                            category: row.in_category,
                            collections: row.collections,
                            privacy: row.privacy,
                            comments: row.comments == 1 ? true : false,
                            attachments: attachments
                        })
                    }
                }

                return ret;
            } else {
                return [];
            }
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async getAuthor(id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE id = $1`, [id]);

            if (rows != null && rows.length > 0) {
                return {
                    id: rows[0].id,
                    username: rows[0].username,
                    moderator: rows[0].moderator == 1 ? true : false,
                    privacy: rows[0].privacy
                };
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async getUserByAuth(auth_cookie) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE auth = $1`, [auth_cookie]);

            if (rows != null && rows.length > 0) {
                return  {
                    id: rows[0].id,
                    username: rows[0].username,
                    bio: rows[0].bio == 'NULL' ? null : rows[0].bio,
                    pronouns: rows[0].pronouns == 'NULL' ? null : rows[0].pronouns,
                    email: rows[0].email,
                    password: rows[0].password,
                    auth: rows[0].auth,
                    moderator: rows[0].moderator == 1 ? true : false,
                    bannedUntil: rows[0].bannedUntil == 'NULL' ? null : rows[0].bannedUntil,
                    music_url: rows[0].music_url == 'NULL' ? null : rows[0].music_url,
                    privacy: rows[0].privacy,
                    dm_privacy: rows[0].message_privacy,
                    verified: rows[0].verified == 1 ? true : false,
                };
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async sendTempPassword(email_address) {
        try {
            const rows = await database.runQuery(`SELECT * FROM users WHERE email = $1`, [email_address]);

            if (rows == null || rows.length == 0) {
                return false;
            }

            let password = generateString(30);

            var salt = await bcrypt.genSalt(10);
            var hash = await bcrypt.hash(password, salt);
    
            var shit = `${Buffer.from(rows[0].id).toString("base64")}-${Buffer.from(rows[0].email).toString("base64")}-${hash}`;
            var key = `${jwt.sign(shit, "OPNIDEA_PRODUCTION16092023$42!x")}`;

            await sendPwEmail(email_address, password);

            await database.runQuery(`UPDATE users SET password = $1, auth = $2 WHERE id = $3`, [hash, key, rows[0].id]);

            return true;
        }
        catch(error) {
            console.log(error);

            return false;
        }
    },
    async getPostAttachments(post_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM attachments WHERE id = $1`, [post_id]);

            if (rows != null && rows.length > 0) {
                let ret = [];

                for(var row of rows) {
                    ret.push({
                        id: row.id,
                        name: row.file_name,
                        original: row.original_file_name,
                        link: row.link,
                        width: row.file_width,
                        height: row.file_height,
                        size: row.file_size
                    })
                }

                return ret;
            } else {
                return [];
            }
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async getPostById(post_id) {
        try {
            const rows = await database.runQuery(`SELECT * FROM posts WHERE id = $1`, [post_id]);

            if (rows != null && rows.length > 0) {
                let author = await this.getAuthor(rows[0].author);
                let attachments = await this.getPostAttachments(rows[0].id);

                if (author == null || attachments.length == 0) {
                    return null;
                }

                let ret = {
                    id: rows[0].id,
                    author: author,
                    caption: rows[0].caption,
                    date: rows[0].date,
                    category: rows[0].in_category,
                    likes: rows[0].likes,
                    collections: [],
                    attachments: attachments,
                    privacy: rows[0].privacy
                }

                if (rows[0].comments == 1) {
                    let comments = [];
                    let commentsrows = await database.runQuery(`SELECT * FROM comments WHERE id = $1`, [post_id]);

                    if (commentsrows != null && commentsrows.length > 0 ) {
                        for(var commentrow of commentsrows) {
                            let author = await database.getProfileById(commentrow.author);

                            if (author == null) {
                                return null;
                            }

                            let mentioned = [];

                            let words = commentrow.content.split(' ');
                            let mentioned_users = [];

                            if (words.length === 0) {
                                if (commentrow.content.startsWith("@")) {  // Change to commentrow.content
                                    let check = commentrow.content.replace("@", "");
                                    let user = await database.getProfileByUsername(check.toLowerCase());  // Change to commentrow.content
                            
                                    if (user != null) {
                                        mentioned_users.push({
                                            id: user.id,
                                            username: user.username
                                        });
                                    }
                                }
                            } else {
                                mentioned = words.filter(x => x.startsWith("@"));
                            
                                if (mentioned.length > 0) {
                                    for (var mention of mentioned) {  // Change to mention
                                        mention = mention.replace("@", "");
                                        
                                        let user = await database.getProfileByUsername(mention.toLowerCase());  // Change to mention
                            
                                        if (user != null) {
                                            mentioned_users.push({
                                                id: user.id,
                                                username: user.username
                                            });
                                        }
                                    }
                                }
                            }

                            comments.push({
                                author: {
                                    id: author.id,
                                    username: author.username,
                                    moderator: author.moderator,
                                    privacy: author.privacy
                                },
                                date: commentrow.date,
                                content: commentrow.content,
                                mentioned_users: mentioned_users
                            })
                        }
                    }

                    ret.comments = comments;
                }

                return ret;
            } else {
                return null;
            }
        }
        catch(error) {
            console.log(error);

            return null;
        }
    },
    async createCollection(author_id, collection_name, privacy_state) {
        try {
            var author = await this.getAuthor(author_id);
    
            if (author == null) {
                return null;
            }

            var id = author_id;
            var name = collection_name;

            if (name.toLowerCase() == 'your liked posts') {
                return null;        
            }

            var privacy = 0;

            if (privacy_state.toLowerCase() == "semi-public") {
                privacy = 1;
            } else if (privacy_state.toLowerCase() == "private") {
                privacy = 2;
            }

            var collection_id = generateString(20);

            await database.runQuery(`INSERT INTO collections (id, author_id, name, posts, privacy) VALUES ($1, $2, $3, $4, $5)`, [collection_id, id, name, 'NULL', privacy]);

            return {
                id: collection_id,
                name: name,
                posts: [],
                privacy: privacy
            };
        }
        catch (error) {
            console.log(error);

            return null;
        }
    },
    async createPost(author_id, caption_text, in_category, privacy_state, comments_enabled, files) {
        try {
            var author = await this.getAuthor(author_id);
    
            if (author == null) {
                return null;
            }

            var id = generateString(20);
            var caption = (caption_text == null || caption_text.length < 2) ? "No caption." : caption_text;
            var category = in_category;
            var date = new Date().toISOString();

            var privacy = 0;
            var comments = 1;

            if (privacy_state.toLowerCase() == "semi-public") {
                privacy = 1;
            } else if (privacy_state.toLowerCase() == "private") {
                privacy = 2;
            }

            if (comments_enabled.toLowerCase() == "disabled") {
                comments = 0;
            }

            let category_check = await this.getOfficialCategories();

            if (category_check.filter(x => x.toLowerCase() == category.toLowerCase()).length == 0) {
                await this.createUnofficialCategory(in_category);
            }
                
            await database.runQuery(`INSERT INTO posts (id, author, caption, date, in_category, collections, privacy, comments) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, [id, author_id, caption, date, category, 0, privacy, comments]);
        
            let return_attachments = [];

            if (files.length > 0) {
                for(var file of files) {
                    return_attachments.push(file);

                    await database.runQuery(`INSERT INTO attachments (id, file_name, original_file_name, link, file_width, file_height, file_size) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [id, file.name, file.original, file.link, file.width, file.height, file.size]);
                }
            }

            return {
                id: id,
                author: author,
                caption: caption,
                date: date,
                likes: 0,
                category: category,
                collections: [],
                attachments: return_attachments,
                privacy: privacy,
                comments: comments == 1
            };
        }
        catch (error) {
            console.log(error);

            return null;
        }
    },
    async updateCollection(user_id, collection_id, object) {
        try {
            let user = await this.getUserById(user_id);

            if (user == null) {
                return false;
            }

            let collections = await database.getUserCollections(user_id);

            collections = collections.filter(x => x.id == collection_id);

            if (collections.length == 0) {
                return false;
            }

            let update_object = {
                name: collections[0].name,
                privacy: collections[0].privacy
            };

            if (object.name != null) {
                update_object.name = object.name;
            }

            if (object.privacy != null) {
                update_object.privacy = object.privacy;
            }

            await database.runQuery(`UPDATE collections SET name = $1, privacy = $2 WHERE id = $3`, [update_object.name, update_object.privacy, collection_id]);

            return true;
        }
        catch(error) {
            console.log(error);
            return false;
        }
    },
    async getTrending() {
        try {
            const rows = await database.runQuery(`SELECT * FROM posts`);

            if (rows != null && rows.length > 0) {
                const hashtagCounts = {};

                for(var row of rows) {
                    const caption = row.caption;
                    const hashtags = caption.match(/#(\w+)/g);

                    if (hashtags && hashtags.length > 0) {
                        for(var hashtag of hashtags) {
                            if (hashtagCounts[hashtag]) {
                                hashtagCounts[hashtag]++;
                            } else {
                                hashtagCounts[hashtag] = 1;
                            }
                        }
                    }
                }

                const hashtagArray = Object.keys(hashtagCounts).map((key) => ({
                    name: key.substring(1),
                    hashtag: true,
                    posts: hashtagCounts[key],
                    category: "trending",
                }));
    
                hashtagArray.sort((a, b) => b.posts - a.posts);

                const top6Hashtags = hashtagArray.slice(0, 6);

                return top6Hashtags;
            } else { 
                return [];
            }
        }
        catch(error) {
            console.log(error);

            return [];
        }
    },
    async getThumbnailsByCategory(category) {
        try {
            if (category.toLowerCase() == "trending") {
                return await this.getTrending();
            }
    
            const rows = await database.runQuery(`SELECT * FROM posts WHERE in_category = $1`, [category]);
    
            if (rows != null && rows.length > 0) {
                const wordCounts = new Map();
    
                for (const row of rows) {
                    const caption = row.caption;
                    const words = caption.split(/\s+/);
                    const encounteredWords = new Set();
    
                    for (const word of words) {
                        if (word.includes("#")) {
                            continue;
                        }

                        const normalizedWord = word.toLowerCase().replace(/[^a-zA-Z0-9]+/g, '');

                        if (encounteredWords.has(normalizedWord)) {
                            continue;
                        }

                        encounteredWords.add(normalizedWord);
    
                        if (wordCounts.has(normalizedWord)) {
                            wordCounts.set(normalizedWord, wordCounts.get(normalizedWord) + 1);
                        } else {
                            wordCounts.set(normalizedWord, 1);
                        }
                    }
                }

                const wordArray = Array.from(wordCounts, ([name, posts]) => ({
                    name: name,
                    hashtag: false,
                    posts: posts,
                    category: category,
                }));

                wordArray.sort((a, b) => b.posts - a.posts);

                const top6Words = wordArray.slice(0, 6);
    
                return top6Words.filter(x => x.posts > 1);
            } else {
                return [];
            }
        } catch (error) {
            console.log(error);
            return [];
        }
    }
};

module.exports = database;

/*
    async getThumbnailsByCategory(category) {
        try {
            if (category.toLowerCase() == "trending") {
                return await this.getTrending();
            }

            const rows = await database.runQuery(`SELECT * FROM posts WHERE in_category = $1`, [category]);
    
            if (rows != null && rows.length > 0) {
                const wordCounts = {};
                let postsInclude = [];
    
                for (var row of rows) {
                    const caption = row.caption;
                    const words = caption.split(/\s+/);
    
                    for (var word of words) {
                        if (!word.includes("#")) {
                            if (wordCounts[word]) {
                                wordCounts[word]++;

                                if (!postsInclude.includes(row.id)) {
                                    postsInclude.push(row.id);
                                }
                            } else {
                                wordCounts[word] = 1;

                                if (!postsInclude.includes(row.id)) {
                                    postsInclude.push(row.id);
                                }
                            }
                        }
                    }
                }
    
                const wordArray = Object.keys(wordCounts).map((key) => ({
                    name: key,
                    hashtag: false,
                    posts: postsInclude.length,
                    category: category
                }));
    
                wordArray.sort((a, b) => b.posts - a.posts);
    
                const top6Words = wordArray.slice(0, 6);
    
                return top6Words.filter(x => x.posts > 1);
            } else {
                return [];
            }
        } catch (error) {
            console.log(error);

            return [];
        }
    }
};
*/