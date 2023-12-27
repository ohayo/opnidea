const request = require('request');
const database = require('./database');
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const client = mailgun.client({ username: 'api', key: 'redacted' });
const fs = require('fs');

function generateString(length) {
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

async function sendEmail(email_to, verification_link) {
    const from = 'OPNIDEA Support <support@opnidea.com>';
    const subject = 'Please verify your OPNIDEA account';
    let html = fs.readFileSync('./emails/verification.html', 'utf8');

    html = html.replace('https://google.com', verification_link);

    const data = {
        from: from,
        to: email_to,
        subject: subject,
        html: html
    };
  
    const result = await client.messages.create('opnidea.com', data);
}

async function sendPwEmail(email_to, newpw) {
    const from = 'OPNIDEA Support <support@opnidea.com>';
    const subject = 'Your temporary password for OPNIDEA';
    let html = fs.readFileSync('./emails/passwordreset.html', 'utf8');

    html = html.replace('passwordhere', newpw);

    const data = {
        from: from,
        to: email_to,
        subject: subject,
        html: html
    };
  
    await client.messages.create('opnidea.com', data);
}

async function sendRegistrationEmail(email, verif_link) {
    await sendEmail(email, verif_link);
}

function verifyCaptcha(value) {
    return new Promise((resolve) => {
        request.post(`https://hcaptcha.com/siteverify`, {
            formData: {
                response: value, 
                secret: "redacted"
            },
            json: true
        }, (err, res, body) => {
            if (body.success != true) {
                resolve(false);
            } else {
                resolve(true);
            }
        });
    });
}

async function checkBan(user) {
    if (user.bannedUntil == null) {
        return false;
    }

    if (user.bannedUntil == 'never') {
        return true;
    }

    let date = new Date(user.bannedUntil);
    let currentDate = Date.now();

    if (date.getTime() > currentDate.getTime()) {
        return true;
    }

    if (currentDate.getTime() > date.getTime()) {
        let attemptUnban = await database.unbanUser(user.id);

        return !attemptUnban;
    }
}

module.exports = {
    generateString,
    verifyCaptcha,
    checkBan,
    sendEmail,
    sendRegistrationEmail,
    sendPwEmail
}