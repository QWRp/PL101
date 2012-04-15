//Adrian Lebioda

var _pitches = {
	c: 0, d: 2, e: 4, f: 5, g: 7, a: 9, b: 11
};

function convertPitch(pitch)
{
	var octave = + pitch[1];
	var letterPitch = _pitches[pitch[0].toLowerCase()];
	
	return 12 + 12 * octave + letterPitch;
}

function compile (musexpr) {
    var result = [];
    
    function compileT(expr, time) {		
		switch(expr.tag) {
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
				var len = compileT(expr.left, time);
				len += compileT(expr.right, time + len);
				
				return len;
			case 'par':
				return Math.max(compileT(expr.left, time),
								compileT(expr.right, time));
			case 'repeat':
				var old_length = result.length;
				var len = compileT(expr.section, time);
				var section = result.slice(old_length);
				var section_length = section.length;
				
				for(var i = 1; i < expr.count; i++) {
					for(var j = 0; j < section_length; j++){
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
        
        return 0;
    }
    
    compileT(musexpr, 0);
    
	result.sort(function(a, b) {
		return a.start - b.start;
	});
	
    return result;
};

var melody_mus = 
	{ tag: 'seq',
		left: { tag: 'rest', duration: 150 },
		right:
		{ tag: 'par',
			left:
			{ tag: 'seq',
			  left: 
			   { tag: 'seq',
				 left: { tag: 'note', pitch: 'a4', dur: 250 },
				 right: { tag: 'note', pitch: 'b4', dur: 250 } },
			  right:
			   { tag: 'seq',
				 left: { tag: 'note', pitch: 'c4', dur: 500 },
				 right: { tag: 'note', pitch: 'd4', dur: 500 } } },
			right:
			{ tag: 'repeat',
				section: 
				{ tag: 'seq',
					left: { tag: 'note', pitch: 'a1', dur: 90 },
					right: { tag: 'note', pitch: 'b1', dur: 100 } },
				count: 3 }}};

console.log(melody_mus);
console.log(compile(melody_mus));
