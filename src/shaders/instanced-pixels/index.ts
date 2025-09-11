export function shaders() {
  return {
    fragment: `#version 300 es
      precision mediump float;

      in vec4 v_color;
      out vec4 outColor;

      void main() {
        outColor = v_color;
      }
    `.trim(),
    vertex: `#version 300 es
      layout(location=0) in vec2 a_unit;
      layout(location=1) in vec2 a_offset;
      layout(location=2) in vec4 a_color;

      uniform mat4 u_projection;
      uniform float u_size;
      out vec4 v_color;

      void main() {
        vec2 pos = a_unit * u_size + a_offset;
        gl_Position = u_projection * vec4(pos, 0.0, 1.0);
        v_color = a_color;
      }
    `.trim()
  }
} 