var fs = require('fs');
var util = require('util');

// The main controller for handling streaming to clients

module.exports = {
	stream: function (req, res) {
		var video_id = req.param('video_id')
		Video.findOne({
			id: video_id
		}).then(function(video){
			var path = video.file;
			var stat = fs.statSync(path);

	        var total = stat.size;
			if (req.headers['range']) {
				var range = req.headers.range;
				var parts = range.replace(/bytes=/, "").split("-");
				var partialstart = parts[0];
				var partialend = parts[1];

				var start = parseInt(partialstart, 10);
				var end = partialend ? parseInt(partialend, 10) : total-1;
				var chunksize = (end-start)+1;

				var file = fs.createReadStream(path, {start: start, end: end});
				res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
				file.pipe(res);
			} else {
				res.writeHead(200, { 'Content-Length': total, 'Content-Type': 'video/mp4' });
				fs.createReadStream(path).pipe(res);
			}
		}).catch(function(err){
			sails.log.info(err);
			res.send(404)
		});
	}
}
