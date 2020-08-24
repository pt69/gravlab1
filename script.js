//MIT-Lizenz: Copyright (c) 2018 Matthias Perenthaler
//
//Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
//
//The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
//THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


let local_frameRate = 60;
let gObjektArray = [];
let massenStartortArr = [];

let masse = 2000; 
let gravitationsKonstante = 1;
let kraftVektorenAnzeigen = true;
let resVektorenAnzeigen = false;
let kraefteAddition = false;

function resetCanvas() {
	gObjektArray = [];
}

let settings;
let resKraftStrichStaerke = 3;
let kraftStrichStaerke = 2;
let kraftAddStrichStaerke = 2;

let planetFarbPalette = [];

function setup() {
  canvas = createCanvas(windowWidth, windowHeight);
  frameRate(local_frameRate);

	let rndO = 30;
	let tempMassOrtArr =	[0, -(height/4 + random(-rndO,rndO)), -(0.67*height/4 + random(-rndO,rndO)), -(0.67*height/4 + random(-rndO,rndO)), -(height/4 + random(-rndO,rndO)), 0, -(0.67*height/4 + random(-rndO,rndO)), (0.67*height/4 + random(-rndO,rndO)), 0, (height/4 + random(-rndO,rndO)), (0.67*height/4 + random(-rndO,rndO)), (0.67*height/4 + random(-rndO,rndO)), (height/4 + random(-rndO,rndO)), 0, (0.67*height/4 + random(-rndO,rndO)), -(0.67*height/4 + random(-rndO,rndO))];
	massenStartortArr = tempMassOrtArr.slice();

	let tempplanetFarbPalette = [color(209, 64, 9), color(49, 48, 46), color(102, 57, 38), color(198, 123, 92), color(64, 68, 54), color(200, 139, 58), color(144, 97, 77), color(33, 35, 84), color(62, 102, 249), color(52, 62, 71), color(123, 120, 105), color(164, 155, 114), color(59, 93, 56), color(140, 177, 222), color(148, 91, 71), color(60, 66, 88)];
	planetFarbPalette = tempplanetFarbPalette.slice();

  settings = QuickSettings.create(20, 20, "Gravitationslabor 1");
	settings.setDraggable(true);
	settings.addRange("Masse des Planeten", 0, 6500, masse, 1, function(value) { masse = value; });			
	settings.addButton("Planet erschaffen", function() { masseDazu(); });
		settings.overrideStyle("Planet erschaffen", "width", "100%");	
	settings.addBoolean("Kraftvektoren anzeigen", true, function(value) { kraftVektorenAnzeigen = value; });		
	settings.addBoolean("resultierende Kraft", false, function(value) { resVektorenAnzeigen = value; });
	settings.addBoolean("Kräfteaddition anzeigen", false, function(value) { kraefteAddition = value; });
	settings.addRange("Gravitationskonstante", 0, 5, gravitationsKonstante, 0.1, function(value) { gravitationsKonstante = value; });		
	settings.addButton("Planeten zerstören", function() { resetCanvas(); });
		settings.overrideStyle("Planeten zerstören", "width", "100%");
	settings.addHTML("Massen bewegen", "<strong>Massen bewegen:</strong></br>Masse anklicken, dann angeklickt bewegen.");
		settings.hideTitle("Massen bewegen");
	settings.addHTML("Version", "V1.01 - Pt");
		settings.hideTitle("Version");  	
}

function windowResized(){
  resizeCanvas(windowWidth, windowHeight);
}

let newFrameKoord;
let oldFrameKoord;
let lastFrameKoord;

function mousePressed() {
  newFrameKoord = createVector(mouseX, mouseY);
}

function mouseReleased() {
  oldFrameKoord = createVector(mouseX, mouseY);
}

function draw() {
  background(250);

  if (mouseIsPressed) {
    newFrameKoord = createVector(mouseX, mouseY);
    lastFrameKoord = createVector(pmouseX, pmouseY);      
    if (lastFrameKoord.equals(oldFrameKoord)) {
        lastFrameKoord = createVector(mouseX, mouseY);
      }        
      for (let i = 0; i < gObjektArray.length; i++) {
        let abstand = dist(lastFrameKoord.x, lastFrameKoord.y, gObjektArray[i].ort.x, gObjektArray[i].ort.y);
        if (abstand < gObjektArray[i].radius) {
          //die gefundene Ladung wird an den Anfang des Ladungsarray geschoben
          gObjektArray = arrayMoveElement(gObjektArray, i, 0);
          if (newFrameKoord.x < 0) { newFrameKoord.x = 0 }
          if (newFrameKoord.x > width) { newFrameKoord.x = width }
          if (newFrameKoord.y < 0) { newFrameKoord.y = 0 }
          if (newFrameKoord.y > height) { newFrameKoord.y = height }            
          gObjektArray[0].verschieben(newFrameKoord); 
          break;
        }
      }
    }
  if (gObjektArray.length > 0) {
  	gravitationsRechner(gObjektArray);
		gObjekteZeichnen(gObjektArray);
  }
}

  //schiebe das gewählte Element an die gewünschte Position 
  function arrayMoveElement(arry, altIndex, neuIndex) {
      if (neuIndex >= arry.length) {
          var k = neuIndex - arry.length + 1;
          while (k--) {
              arry.push(undefined);
          }
      }
      arry.splice(neuIndex, 0, arry.splice(altIndex, 1)[0]);
      return arry;
  } 

function gObjekt(m, ort) {
	this.masse = m;
	this.ort = ort;
	this.gKraftArray = [];
	this.resGKraft = createVector(0, 0);
	let randomIndex = Math.ceil(random(planetFarbPalette.length-1));
	this.farbe = planetFarbPalette[randomIndex];
	this.radius = Math.cbrt(this.masse);
  this.verschieben = function(neueKoord) {
    this.ort = neueKoord;
  }; 	
}

function gObjektDazu(m, ort) {
	let gObj = new gObjekt(m, ort);
	gObjektArray.push(gObj);
}

function gObjekteZeichnen(gObjArr) {
	for (let i = 0; i < gObjArr.length; i++) {
		let x = gObjArr[i].ort.x;
		let y = gObjArr[i].ort.y;
		let offset = 8;
		strokeWeight(1);
		stroke(gObjArr[i].farbe);
		fill(gObjArr[i].farbe);
		ellipse(x, y, gObjArr[i].radius*2, gObjArr[i].radius*2);		
		if(resVektorenAnzeigen){
			strokeWeight(resKraftStrichStaerke);
			stroke(gObjArr[i].farbe);
			fill(gObjArr[i].farbe);
			line(x, y, x + gObjArr[i].resGKraft.x, y + gObjArr[i].resGKraft.y);
	    push();
		    var angle = atan2(gObjArr[i].resGKraft.y, gObjArr[i].resGKraft.x);
		    translate(x + gObjArr[i].resGKraft.x, y + gObjArr[i].resGKraft.y);
		    rotate(angle+HALF_PI);
		    triangle(-offset*0.5, offset, offset*0.5, offset, 0, 0);
	    pop();			
		}
		if(kraftVektorenAnzeigen) {
			for(let j = 0; j < gObjArr[i].gKraftArray.length; j++){
				strokeWeight(kraftStrichStaerke);
				stroke('darkgrey');
				fill('darkgrey');
				line(x, y, x + gObjArr[i].gKraftArray[j].x, y + gObjArr[i].gKraftArray[j].y);		
	 	    push();
			    var angle = atan2(gObjArr[i].gKraftArray[j].y, gObjArr[i].gKraftArray[j].x);
			    translate(x + gObjArr[i].gKraftArray[j].x, y + gObjArr[i].gKraftArray[j].y);
			    rotate(angle+HALF_PI);
			    triangle(-offset*0.5, offset, offset*0.5, offset, 0, 0);
		    pop();				
			}
		}
		if(kraefteAddition) {
			push();				
				translate(x, y);
				for(let j = 0; j < gObjArr[i].gKraftArray.length; j++){
					strokeWeight(kraftAddStrichStaerke);
					stroke('wheat');
					fill('wheat');
					line(0, 0, gObjArr[i].gKraftArray[j].x, gObjArr[i].gKraftArray[j].y);	
		 	    push();
				    var angle = atan2(gObjArr[i].gKraftArray[j].y, gObjArr[i].gKraftArray[j].x);
				    translate(gObjArr[i].gKraftArray[j].x, gObjArr[i].gKraftArray[j].y);
				    rotate(angle+HALF_PI);
				    triangle(-offset*0.5, offset, offset*0.5, offset, 0, 0);
			    pop();
			    translate(gObjArr[i].gKraftArray[j].x, gObjArr[i].gKraftArray[j].y);
				}
			pop();
		}
	}
}

function gravitationsRechner(gObjArr) {
	for (let i = 0; i < gObjArr.length; i++) {
		let gKraftTempArray = [];
		gObjArr[i].gKraftArray = [];		
		let resultierendeGKraft = createVector(0,0);
		for (let j = 0; j < gObjArr.length; j++) {
			if (j != i) {
				let entfernung = gObjArr[i].ort.dist(gObjArr[j].ort);
				let gravitationsKraft = gravitationsKonstante * (gObjArr[i].masse * gObjArr[j].masse) / Math.pow(entfernung, 2);
				let richtungsVektor = p5.Vector.sub(gObjArr[j].ort, gObjArr[i].ort);
				richtungsVektor.normalize();
				let gravitationsVektor = createVector(0, 0);
				gravitationsVektor.add(richtungsVektor.mult(gravitationsKraft));
				resultierendeGKraft.add(gravitationsVektor);
				let tempVec = createVector(0, 0);
				gKraftTempArray.push(tempVec);
				gKraftTempArray[gKraftTempArray.length-1].add(gravitationsVektor);
			}
		}
		gObjArr[i].resGKraft.set(0, 0);
		gObjArr[i].resGKraft.add(resultierendeGKraft);
		gObjArr[i].gKraftArray = gKraftTempArray.slice();
	}
}

function masseDazu() {
	let ortVec = createVector(0, 0);
	if(gObjektArray.length < 8){
		let tempVec = createVector(width/2 + massenStartortArr[gObjektArray.length*2], height/2 + massenStartortArr[gObjektArray.length*2+1]);
		ortVec.add(tempVec);
	} else {
		let tempVec = createVector(random(width/2-100, width/2+100), random(height/2-100, height/2+100));	
		ortVec.add(tempVec);
	}
  gObjektDazu(masse, ortVec);
}