/**
 * Created by Janne on 2.7.2014.
 */

"use strict";

var express = require('express');
var router = express.Router();
var googleapis = require('googleapis');
var Youtubecommands = require('./youtube/youtube-commands.js');
var MetadataParser = require('./metadata/metadata-parser.js');
var fs = require('fs');
var busboy = require('connect-busboy');

/**
 * GET playlists.
 */
router.get('/playlists', function (req, res) {

    var youtubeCommands, oauth2Client;
    youtubeCommands = new Youtubecommands();

    if (youtubeCommands.checkForTokens(req, res) === false) {
        res.redirect('/login');
        return;
    }
    oauth2Client = youtubeCommands.initiliazeOauth(req, res);

    // Try getting g+ info
    googleapis
        .discover('youtube', 'v3')
        .execute(function (err, client) {

            if (err) {
                res.send("Received an error", err);
                return;
            }

            youtubeCommands.getPlaylists(client, oauth2Client, function (err, result) {
                if (err) {
                    youtubeCommands.CheckForErrorType(err, res);
                    return;
                }

                res.send(result);

            });
        });

});


/* GET Playlist Items. */
router.get('/playlistItems', function (req, res) {

    var youtubeCommands, oauth2Client;
    youtubeCommands = new Youtubecommands();
    if (youtubeCommands.checkForTokens(req, res) === false) {
        res.redirect('/login');
        return;
    }
    oauth2Client = youtubeCommands.initiliazeOauth(req, res);

    // Try getting g+ info
    googleapis
        .discover('youtube', 'v3')
        .execute(function (err, client) {
            if (err) {
                res.send("Received an error", err);
                return;
            }

            youtubeCommands.getPlaylistItems(client, oauth2Client, "PLX0jcZ2eQoOa6AISCWiwNAWSlNVVSup5W", function (err, result) {
                if (err) {
                    youtubeCommands.CheckForErrorType(err, res);
                    return;
                }

                res.json(result);

            });
        });

});

/* GET video. */
router.get('/videos', function (req, res) {

    var youtubeCommands, oauth2Client;
    youtubeCommands = new Youtubecommands();
    if (youtubeCommands.checkForTokens(req, res) === false) {
        res.redirect('/login');
        return;
    }
    oauth2Client = youtubeCommands.initiliazeOauth(req, res);

    // Try getting g+ info
    googleapis
        .discover('youtube', 'v3')
        .execute(function (err, client) {
            if (err) {
                res.send("Received an error", err);
                return;
            }
            youtubeCommands.getVideos(client, oauth2Client, "JyLL-95IjzA", function (err, result) {
                if (err) {
                    youtubeCommands.CheckForErrorType(err, res);
                    return;
                }

                res.send(result);

            });
        });

});

router.get('/metadatatest', function (req, res) {

    var metadataParser, source;
    // Initialize the Metadata parser
    metadataParser = new MetadataParser();
    // Set the source
    source = "/youtube/nauhoite.mp4";

    // Parse the video information for the creation time
    metadataParser.ParseMetadata(source, function (err, metadataObject) {
        if (err) {
            res.send(err);
            return;
        }

        // Display the creation time at the web site
        res.send(metadataObject.getCreationTime());
    });

});

/* GET Upload page for videos */
router.get('/upload', function (req, res) {

    var youtubeCommands, oauth2Client;
    youtubeCommands = new Youtubecommands();
    if (youtubeCommands.checkForTokens(req, res) === false) {
        res.redirect('/login');
        return;
    }
    oauth2Client = youtubeCommands.initiliazeOauth(req, res);

    googleapis
        .discover('youtube', 'v3')
        .execute(function (err, client) {

            if (err) {
                res.send("Received an error", err);
                return;
            }
            // Create the metadata
            var metadata = youtubeCommands.createMetadata("TestUpload",
                                          "Testing how well the upload works",
                                          "unlisted",
                                          ["test", "upload"]);

            // And then upload the video
            youtubeCommands.uploadVideo(client, oauth2Client, metadata, "nauhoite.mp4", function (err, result) {
                if (err) {
                    youtubeCommands.CheckForErrorType(err, res);
                    return;
                }

                // Get the videoId
                var videoId = result.id;

                console.log(result);

                youtubeCommands.insertToPlaylist(client, oauth2Client, "PLX0jcZ2eQoOa6AISCWiwNAWSlNVVSup5W", videoId, function (err, insertResult) {
                    if (err) {
                        youtubeCommands.CheckForErrorType(err, res);
                        return;
                    }
                    // Otherwise, things okay. Send the result
                    res.send(insertResult);
                });

            });

        });


});

/* POST Upload page */
router.post('/upload', function (req, res) {

    // Initialize filestream
    var fstream;
    // Make a pipe
    req.pipe(req.busboy);
    // Then, use busboy to read the file
    req.busboy.on('file', function (fieldname, file, filename) {

        console.log("Uploading: " + filename);

        var path = __dirname + '/tempfiles/' + filename;

        // Create a writestream for the data
        fstream = fs.createWriteStream(path);

        // Then, pipe the data to the filestream
        file.pipe(fstream);

        // And then finally close the pipestream
        fstream.on('close', function (err) {
            if (err) {
                res.send(err);
                return;
            }
            //res.send("Upload done!");
            UploadToYoutube(req, res, path);
        });

    });


});

function UploadToYoutube(req, res, filepath) {

    var youtubeCommands, oauth2Client;
    youtubeCommands = new Youtubecommands();
    if (youtubeCommands.checkForTokens(req, res) === false) {
        res.redirect('/login');
        return;
    }
    oauth2Client = youtubeCommands.initiliazeOauth(req, res);

    googleapis
        .discover('youtube', 'v3')
        .execute(function (err, client) {

            if (err) {
                res.send("Received an error", err);
                return;
            }
            // Create the metadata
            var metadata = youtubeCommands.createMetadata("TestUpload",
                "Testing how well the upload works",
                "unlisted",
                ["test", "upload"]);

            // And then upload the video
            youtubeCommands.uploadVideo(client, oauth2Client, metadata, filepath, function (err, result) {
                if (err) {
                    youtubeCommands.CheckForErrorType(err, res);
                    return;
                }

                // Get the videoId
                var videoId = result.id;

                console.log(result);

                youtubeCommands.insertToPlaylist(client, oauth2Client, "PLX0jcZ2eQoOa6AISCWiwNAWSlNVVSup5W", videoId, function (err, insertResult) {
                    if (err) {
                        youtubeCommands.CheckForErrorType(err, res);
                        return;
                    }
                    // Otherwise, things okay. Send the result
                    res.send(insertResult);
                });

            });

        });

}


/* GET Upload page for videos */
router.get('/changePlaylist/:id', function (req, res) {

    console.log(req.params);

    var youtubeCommands, oauth2Client, videoId;
    // Get the videoId
    videoId = req.params.id;
    youtubeCommands = new Youtubecommands();
    if (youtubeCommands.checkForTokens(req, res) === false) {
        res.redirect('/login');
        return;
    }
    oauth2Client = youtubeCommands.initiliazeOauth(req, res);

    googleapis
        .discover('youtube', 'v3')
        .execute(function (err, client) {


            youtubeCommands.insertToPlaylist(client, oauth2Client, "PLX0jcZ2eQoOa6AISCWiwNAWSlNVVSup5W", videoId, function (err, insertResult) {
                if (err) {
                    youtubeCommands.CheckForErrorType(err, res);
                    return;
                }

                // Otherwise, things okay. Send the result
                res.send(insertResult);
            });
        });
});


module.exports = router;