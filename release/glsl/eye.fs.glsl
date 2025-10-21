in vec3 modelPos;

void main() {
	// TODO: Add some conditions to color the pupil
	// The eye is facing +z so that when it is initially positioned on the fox,
	// it should be facing backward.
	// The following color is Eye whites (the fox is tired, so the eye whites are pinkish).

	//we want to keep the whites of the eyes but given distance to the edge of the sphere have
	//different colors for both the pupil and the iris
	
	vec3 norm = normalize(modelPos); //just to ensure we have values from 0 - 1. I mean obviously but still

	float radius2D = length(norm.xy);
	
	//let's say that the pupil stops at .2 and the iris stop at .6 (this will change)
	float pupilBound = .3;
	float irisBound = .7;

	vec3 pupilColor = vec3(0.02, 0.02, 0.02);
	vec3 irisColor = vec3(0.16, 0.12, 0.69);
	vec3 color;

	if (radius2D < .3) {
		color = pupilColor;
	}
	else if (radius2D < .7) {
		color = irisColor;
	}
	else {
		color = vec3(0.93, 0.84, 0.84);
	}


	
	gl_FragColor = vec4(color, 1.0);
}
