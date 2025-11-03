#version 300 es
precision highp float;


uniform vec3 u_color;

in vec3 v_normal;
out vec4 f_color;

void main() {
   
    f_color = vec4(u_color, 1.0f);
}