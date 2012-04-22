//Adrian Lebioda

var convertPitch = (function () {
	"use strict";
	var pitches = {
		c: 12,
		d: 14,
		e: 16,
		f: 17,
		g: 19,
		a: 21,
		b: 23
	};

	function convertPitch(pitch) {
		var octave = parseInt(pitch[1], 10),
			letterPitch = pitches[pitch[0].toLowerCase()];

		return 12 * octave + letterPitch;
	}

	return convertPitch;
}());

var compile = (function () {
	"use strict";
	var result;

	function compileT(expr, time) {
		var len = 0, old_length, section, section_length, i, j;
		switch (expr.tag) {
		case 'note':
			result.push({
				tag: 'note',
				pitch: convertPitch(expr.pitch),
				start: time,
				dur: expr.dur
			});

			return expr.dur;
		case 'rest':
			return expr.duration;
		case 'seq':
			len = compileT(expr.left, time);
			len += compileT(expr.right, time + len);

			return len;
		case 'par':
			return Math.max(compileT(expr.left, time),
							compileT(expr.right, time));
		case 'repeat':
			old_length = result.length;
			len = compileT(expr.section, time);
			section = result.slice(old_length);
			section_length = section.length;

			for (i = 1; i < expr.count; ++i) {
				for (j = 0; j < section_length; ++j) {
					result.push({
						tag: 'note',
						pitch: section[j].pitch,
						start: section[j].start + i * len,
						dur: section[j].dur
					});
				}
			}

			return len * expr.count;
		default:
			throw "Unsupported tag: '" + expr.tag + "'!";
		}
	}

	function sortNotes(a, b) {
		return a.start - b.start;
	}

	function compile(musexpr) {
		result = [];
		compileT(musexpr, 0);

		result.sort(sortNotes);

		return result;
	}

	return compile;
}());

exports.convertPitch = convertPitch;
exports.compile = compile;
