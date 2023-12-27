const express = require('express')
const app = express();
const cors = require('cors');
const database = require('./helpers/database');
const fs = require('fs');
const auth = require('./routes/auth');
const categories = require('./routes/categories');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const path = require('path');
const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const posts = require('./routes/posts');
const profiles = require('./routes/profiles');
const messages = require('./routes/messages');
const me = require('./routes/myself');
const collections = require('./routes/collections');
const search = require("./routes/search");
const request = require('request');
const rateLimit = require('express-rate-limit');
const ExifTool = require("exiftool-vendored").ExifTool
const exiftool = new ExifTool()
const admin = require('./routes/admin');
const checkBan = require('./helpers/general').checkBan;
const cacheManager = require('./helpers/cacheManager');

const limiter = rateLimit({
    windowMs: 1000 * 60,
    max: 250,
    message: 'Whoa! Slow down a bit, will you?',
});

const updateLimit = rateLimit({
    windowMs: 1000 * 60 * 60,
    max: 10,
    message: 'Too many requests!'
})

app.use(limiter);

app.set('trust proxy', 1)

app.use(cors())

app.use(express.json());

app.use("/api/auth", auth);

app.use('/api/admin', admin);

app.use("/api/myself", me); 

app.use("/api/posts", posts);

app.use("/api/categories", categories);

app.use("/api/collections", collections);

app.use("/api/profiles", profiles);

app.use("/api/messages", messages);

app.use("/api/search", search);

app.get("/api/trending", async (req, res) => {
    try {
        let entry = cacheManager.findById("trending");

        if (entry == null) {
            let trending = await database.getTrending();
            let posts = await database.getPosts();
            let ret = [];
    
            for(var trend of trending) {
                let uh = posts.filter(x => x.caption.toLowerCase().includes(`#${trend.name.toLowerCase()}`) && x.privacy == 0);
    
                ret.push(...uh);
            }

            cacheManager.add("trending", 200, ret);

            return res.status(200).json(ret);
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

app.get("/api/trending/thumbnails", async (req, res) => {
    try {
        let entry = cacheManager.findById("trending-thumbnails");

        if (entry == null) {
            let trending = await database.getTrending(); 

            cacheManager.add("trending-thumbnails", 200, trending);

            return res.status(200).json(trending);
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

async function getVideoMetadata(filePath) {
    return new Promise((resolve, reject) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err) {
          reject(err);
        } else {
          const videoStream = metadata.streams.find(stream => stream.codec_type === 'video');
          if (videoStream) {
            const width = videoStream.width;
            const height = videoStream.height;
            resolve({ width, height });
          } else {
            reject(new Error('No video stream found in the file'));
          }
        }
      });
    });
}

function stripExifData(inputFile) {
    try {
        exiftool.write(inputFile, { 
            GPSLatitude: null,
            GPSAltitude: null,
            GPSAltitudeRef: null,
            GPSAreaInformation: null,
            GPSCoordinates: null,
            GPSDateStamp: null,
            GPSDateTime: null,
            GPSDestBearing: null,
            GPSDestBearingRef: null,
            GPSDestDistance: null,
            GPSDestLatitude: null,
            GPSDestLatitudeRef: null,
            GPSDestLongitude: null,
            GPSDestLongitudeRef: null,
            GPSDifferential: null,
            GPSDOP: null,
            GPSHPositioningError: null,
            GPSImgDirection: null,
            GPSImgDirectionRef: null,
            GPSLatitudeRef: null,
            GPSLongitude: null,
            GPSLongitudeRef: null,
            GPSMapDatum: null,
            GPSPosition: null,
            GPSProcessingMethod: null,
            GPSSatellites: null,
            GPSSpeed: null,
            GPSSpeedRef: null,
            GPSStatus: null,
            GPSTimeStamp: null,
            GPSTrack: null,
            GPSTrackRef: null,
            GPSVersionID: null,
            Location: null,
            LocationAccuracyHorizontal: null,
            LocationAreaCode: null,
            LocationInfoVersion: null,
            LocationName: null,
            LocalLocationName: null,
            "Sub-location": null,
            ContentLocationCode: null,
            ContentLocationName: null,
            "Country-PrimaryLocationCode": null,
            "Country-PrimaryLocationName": null,
        });      
    } catch (error) { }
}

app.post("/api/publish", updateLimit, upload.array('files', 4), async (req, res) => {
    try {
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

        if (!req.body.caption) {
            return res.status(400).json({
                success: false,
                message: "A caption is required."
            });
        }

        if (req.body.caption.length < 2) {
            return res.status(400).json({
                success: false,
                message: "Post captions must be more than 2 characters and less than 500 characters in length."
            });
        }

        if (req.body.caption.length > 500) {
            return res.status(400).json({
                success: false,
                message: "Post captions must be more than 2 characters and less than 500 characters in length."
            });
        }
    
        if (!req.body.category) {
            return res.status(400).json({
                success: false,
                message: "A category is required."
            });
        }
    
        if (!req.body.privacy) {
            return res.status(400).json({
                success: false,
                message: "A valid privacy setting is required."
            });
        }
    
        if (!req.files) {
            return res.status(400).json({
                success: false,
                message: "At least one file is required."
            });
        }
    
        if (req.files.length == 0) {
            return res.status(400).json({
                success: false,
                message: "At least one file is required."
            });
        }

        let allowed_extensions = [
            ".png",
            ".jpg",
            ".gif",
            ".webp",
            ".webm",
            ".mp4",
            ".mov"
        ]
    
        let files_to_send = [];

        for(var file of req.files) {
            let extension = path.extname(file.originalname);

            if (!allowed_extensions.includes(extension)) {
                return res.status(400).json({
                    success: false,
                    message: "That file extension isn't supported. (Supported types: .png, .jpg, .gif, .webp, .mp4, .mov and .webm)"
                });
            }

            var link = `${Date.now() + Math.round(Math.random() * 1E9)}${extension}`;

            fs.writeFileSync(`../public/files/${link}`, file.buffer);

            let file_data = {
                name: link,
                original: file.originalname,
                link: `/files/${link}`,
                size: file.size,
                width: 0,
                height: 0
            }

            if (extension == ".mp4" || extension == ".webm" || extension == ".mov") {
                //const { width, height } = await getVideoMetadata(`../public/files/${link}`);

                file_data.width = 0; //to-do
                file_data.height = 0; //to-do
            } else {
                const data = fs.readFileSync(`../public/files/${link}`);
                const metadata = await sharp(data).metadata();
                const { width, height } = metadata;

                file_data.width = width;
                file_data.height = height;

                stripExifData(`../public/files/${link}`);

                if (fs.existsSync(`../public/files/${link}_original`)) {
                    fs.unlinkSync(`../public/files/${link}_original`);
                }
            }

            //if (extension == ".jpg") {
                //await sharp(fs.readFileSync(`../public/files/${link}`)).jpeg({quality: 50}).toFile(`../public/files/${link}`);
           // }

            files_to_send.push(file_data);
        }

        let result = await database.createPost(user.id, req.body.caption, req.body.category, req.body.privacy, req.body.comments, files_to_send);

        if (result == null) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error. Try again later."
            });
        }

        let entry = cacheManager.findById(`${req.body.category}-posts`);

        if (entry != null) {
            cacheManager.remove(`${req.body.category}-posts`);
        }

        return res.status(200).json({
            post: result,
            url: `/posts/${result.id}`
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

app.post("/api/other/submit_copyright_complaint", updateLimit, async (req, res) => {
    try {
        let user = await database.getUserByAuth(req.headers.authorization);

        if (user == null) {
            return res.status(401).json({
                success: false,
                message: "Authentication is required."
            });
        }

        if (user.bannedUntil != null) {
            return res.status(401).json({
                success: false,
                message: "Banned users are unable to write to anything and are limited to read-only functionality (Yes, this includes copyrighted reporting too)."
            });
        }

        if (!user.verified) {
            return res.status(401).json({
                success: false,
                message: "You need to verify your account before you can do that action."
            });
        }

        if (!req.body.allegedCopyrightedContent || req.body.allegedCopyrightedContent.length <= 5) {
            return res.status(400).json({
                success: false,
                message: "Alleged Copyrighted Content is required."
            });
        }

        if (!req.body.acknowledgedReportMustBeFaithful || req.body.acknowledgedReportMustBeFaithful == false) {
            return res.status(400).json({
                success: false,
                message: "Acknowledging that your report must be faithful is required."
            });
        }

        if (!req.body.acknowledgedReportsCantBeAbused || req.body.acknowledgedReportsCantBeAbused == false) {
            return res.status(400).json({
                success: false,
                message: "Acknowledging that reporting must not be abused is required."
            });
        }

        let attempt = await database.submitCopyrightComplaint(user.id, req.body.allegedCopyrightedContent);

        if (!attempt) {
            return res.status(400).json({
                success: false,
                message: "Something went wrong while submitting your copyright complaint."
            })
        }

        let fields = [];
        let offensive = req.body.allegedCopyrightedContent.split('\n');

        for(var i = 0; i < offensive.length; i++) {
            fields.push({
                name: `Offending URL (${i + 1}/${offensive.length})`,
                value: offensive[i].toString(),
                inline: false
            })
        }

        request.post(`discord webhook link but redacted`, {
            json: true,
            body: {
                content: "",
                username: "OPNIDEA | COPYRIGHT COMPLAINTS",
                tts: false,
                embeds: [{
                    title: "Copyright Complaint",
                    author: {
                        name: `Submitted by User ID: ${user.id}`,
                    },
                    color: 0xfb0707,
                    fields: fields
                }]
            }
        })

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

app.listen(2192, async () => {
    await database.setupDatabase();

    cacheManager.setup();

    console.log("[LOG] OPNIDEA (ENVISION) -> PORT 2192")
});