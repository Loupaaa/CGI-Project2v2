import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, perspective, } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix } from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as SPHERE from '../../libs/objects/sphere.js'
import * as TORUS from '../../libs/objects/torus.js'
import { mult } from "./libs/MV.js";




function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let uColorLocation = gl.getUniformLocation(program, "u_color");

    let mProjection = ortho(-1 * aspect, aspect, -1, 1, -10, 10);
    let mView = lookAt([2, 1.2, 5], [0, 0, 0], [0, 1, 0]);

    let zoom = 1.0;

    let viewSize = 0.8;


    /** Model parameters */
    let ag = 0;
    let rg = 0;
    let rb = 0;
    let rc = 0;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();


        if (event.deltaY < 0) {

            zoom /= 1.1;
        } else {

            zoom *= 1.1;
        }


        resize_canvas();
    });

    document.onkeydown = function (event) {
        switch (event.key) {
            case '1':
                mView = lookAt([0, 0.3, 5], [0, 0.3, 0], [0, 1, 0]);

                viewSize = 0.8;
                break;
            case '2':
                // Top view
                mView = lookAt([0, 5, 0], [0, 0.3, 0], [0, 0, -1]);

                viewSize = 1.0;
                break;
            case '3':
                // Right view 
                mView = lookAt([-5, 0.3, 0.], [0, 0.3, 0], [0, 1, 0]);
                viewSize = 0.8;

                break;
            case '4':


                // Multiplica a projeção ortográfica pela matriz de cisalhamento
                mProjection = mult(mProjection, oblique);

                // Mantém a câmara fixa
                mView = lookAt([0, 1, 0], [0, 0, 0], [0, 1, 0]);

                viewSize = 3.0;
                break;

            case '9':
                mode = gl.LINES;
                break;
            case '0':
                mode = gl.TRIANGLES;
                break;
            case 'p':
                ag = Math.min(0.050, ag + 0.005);
                break;
            case 'o':
                ag = Math.max(0, ag - 0.005);
                break;
            case 'q':
                rg += 1;
                break;
            case 'e':
                rg -= 1;
                break;
            case 'w':
                rc = Math.min(120, rc + 1);
                break;
            case 's':
                rc = Math.max(-120, rc - 1);
                break;
            case 'a':
                rb -= 1;
                break;
            case 'd':
                rb += 1;
                break;
            case '+':
                zoom /= 1.1;
                break;
            case '-':
                zoom *= 1.1;
                break;
        }
    }

    gl.clearColor(0.6, 0.7, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);   // Enables Z-buffer depth test

    CUBE.init(gl);
    CYLINDER.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);

    window.requestAnimationFrame(render);


    function resize_canvas(event) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        aspect = canvas.width / canvas.height;

        gl.viewport(0, 0, canvas.width, canvas.height);
        if (aspect > 1) {
            //  WIDE 
            mProjection = ortho(-viewSize * aspect * zoom, viewSize * aspect * zoom, -viewSize * zoom, viewSize * zoom, -10, 10);
        } else {
            // TALL
            mProjection = ortho(-viewSize * zoom, viewSize * zoom, -viewSize / aspect * zoom, viewSize / aspect * zoom, -10, 10);
        }
    }

    function uploadProjection() {
        uploadMatrix("u_projection", mProjection);
    }

    function uploadModelView() {
        uploadMatrix("u_model_view", modelView());
    }

    function uploadMatrix(name, m) {
        gl.uniformMatrix4fv(gl.getUniformLocation(program, name), false, flatten(m));
    }


    /**
     *o 1º retângulo
     */
    function Base() {

        //desenhar 1 vez
        pushMatrix();
        gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);

        multScale([1.5, 0.16, 0.8]);

        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);

        popMatrix();

        // Repetir para fazer linhas ns se é assim

        pushMatrix();
        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);

        multScale([1.501, 0.161, 0.801]);
        uploadModelView();

        CUBE.draw(gl, program, gl.LINES);
        popMatrix();
    }

    /**
     *o 2º retângulo
     */
    function TankMiddleLayer() {

        //desenhar 1 vez
        pushMatrix();
        gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);

        multScale([1.6, 0.1, 0.9]);

        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
        popMatrix();

        //Repetir para fazer linhas ns se é assim

        pushMatrix();
        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);

        multScale([1.601, 0.101, 0.901]);
        uploadModelView();

        CUBE.draw(gl, program, gl.LINES);
        popMatrix();
    }

    /**
     * Upper 3º Retangulo e Cabina
     */
    function TankUpperL_Cabin() {

        // desenhar 1 vez
        pushMatrix();
        gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);

        multScale([1.0, 0.24, 0.5]);
        uploadModelView();
        CUBE.draw(gl, program, gl.TRIANGLES);
        popMatrix();

        //Repetir para fazer linhas ns se é assim
        pushMatrix();
        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);

        multScale([1.001, 0.241, 0.501]);
        uploadModelView();

        CUBE.draw(gl, program, gl.LINES);
        popMatrix();

    }



    function rotatinThingy() {

        pushMatrix();

        gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
        multTranslation([0, -0.32, 0]);

        multTranslation([-0.5, 0.5, 0]);

        multRotationX(90);
        multScale([0.12, 0.12, 0.12]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.TRIANGLES);

        popMatrix();


        pushMatrix();

        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);


        multTranslation([0, -0.32, 0]);

        multTranslation([-0.5, 0.5, 0]);
        multRotationX(90);

        multScale([0.121, 0.121, 0.121]);

        uploadModelView();
        CYLINDER.draw(gl, program, gl.LINES);
        popMatrix();

        Cannon();
    }
    function topHalfSphere() {

        pushMatrix();

        gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
        multTranslation([0, 0.52, 0]);
        multScale([0.4, 0.2, 0.4]);
        multRotationX(180);
        uploadModelView();
        SPHERE.draw(gl, program, gl.TRIANGLES);

        popMatrix();


        pushMatrix();

        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
        multTranslation([0, 0.52, 0]);
        multScale([0.401, 0.201, 0.401]);
        multRotationX(180);
        uploadModelView();
        SPHERE.draw(gl, program, gl.LINES);
        popMatrix();


    }

    function topSphereComplement() {

        pushMatrix();

        gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
        multTranslation([0, 0.55, 0]);
        multScale([0.16, 0.16, 0.16]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.TRIANGLES);

        popMatrix();

        pushMatrix();

        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
        multTranslation([0, 0.55, 0]);
        multScale([0.161, 0.161, 0.161]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.LINES);

        popMatrix();
    }

    function wheels() {

        // --- Define wheel and layout properties ---
        const numWheels = 6;
        const baseLength = 1.4;
        const baseWidth = 0.855;
        const localYCenter = 0.03;
        const wheelRadius = 0.15; // Raio do pneu (Torus)

        // --- Propriedades da Jante (Cilindro) ---
        const rimRadius = 0.10; // A jante é mais pequena que o pneu
        const rimThickness = 0.05; // A jante é mais grossa que o pneu

        // --- Calculate positions ---
        const spacing = baseLength / numWheels;
        const startX = -baseLength / 2 + spacing / 2;
        const zPosRight = baseWidth / 2 - 0.004;
        const zPosLeft = -baseWidth / 2 + 0.004;

        for (let i = 0; i < numWheels; i++) {
            const xPos = startX + i * spacing;

            // --- Rodas Direitas ---
            pushMatrix();
            multTranslation([xPos, localYCenter, zPosRight]);
            multRotationX(90);


            gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
            pushMatrix();
            multScale([wheelRadius, wheelRadius * 0.6, wheelRadius]);
            uploadModelView();
            TORUS.draw(gl, program, gl.TRIANGLES);
            popMatrix();

            gl.uniform3f(uColorLocation, 0.4, 0.4, 0.4);
            pushMatrix();
            multScale([wheelRadius + 0.001, wheelRadius * 0.6 + 0.001, wheelRadius + 0.001]);
            uploadModelView();
            TORUS.draw(gl, program, gl.LINES);
            popMatrix();


            gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
            pushMatrix();
            multScale([rimRadius, rimThickness * 0.6, rimRadius]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.TRIANGLES);
            popMatrix();

            gl.uniform3f(uColorLocation, 0.25, 0.25, 0.25);
            pushMatrix();
            multScale([rimRadius + 0.001, rimThickness * 0.6 + 0.001, rimRadius + 0.001]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.LINES);
            popMatrix();

            popMatrix();



            pushMatrix();
            multTranslation([xPos, localYCenter, zPosLeft]);
            multRotationX(90);

            // --- Rodas Esquerdas ---


            gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
            pushMatrix();
            multScale([wheelRadius, wheelRadius * 0.6, wheelRadius]);
            uploadModelView();
            TORUS.draw(gl, program, gl.TRIANGLES);
            popMatrix();

            gl.uniform3f(uColorLocation, 0.4, 0.4, 0.4);
            pushMatrix();
            multScale([wheelRadius + 0.001, wheelRadius * 0.6 + 0.001, wheelRadius + 0.001]);
            uploadModelView();
            TORUS.draw(gl, program, gl.LINES);
            popMatrix();


            gl.uniform3f(uColorLocation, 0.5, 0.5, 0.5);
            pushMatrix();
            multScale([rimRadius, rimThickness * 0.6, rimRadius]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.TRIANGLES);
            popMatrix();

            gl.uniform3f(uColorLocation, 0.7, 0.7, 0.7);
            pushMatrix();
            multScale([rimRadius + 0.001, rimThickness * 0.6 + 0.001, rimRadius + 0.001]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.LINES);
            popMatrix();

            popMatrix();
        }
    }

    function Cannon() {

        pushMatrix();


        gl.uniform3f(uColorLocation, 0.25, 0.25, 0.25);


        multTranslation([-0.4, 0.08, 0]);
        multRotationZ(45);
        multTranslation([0, 0.7, 0]);


        multScale([0.025, 1.2, 0.025]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.TRIANGLES);

        popMatrix();


        pushMatrix();

        gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
        multTranslation([-0.4, 0.08, 0]);
        multRotationZ(45);
        multTranslation([0, 0.7, 0]);

        multScale([0.025, 1.2, 0.025]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.LINES);

        popMatrix();
    }


    /**
     * Tanque Main
     */
    function Tank() {

        pushMatrix();
        multTranslation([0, 0.08, 0]);

        pushMatrix();

        multTranslation([0, 0.1, 0]);
        Base();

        popMatrix();

        pushMatrix();

        wheels();

        popMatrix();

        pushMatrix();

        multTranslation([0, 0.23, 0]);
        rotatinThingy();

        popMatrix();

        pushMatrix();


        topHalfSphere();

        popMatrix();
        pushMatrix();

        topSphereComplement();
        popMatrix();

        pushMatrix();

        multTranslation([0, 0.23, 0]);
        TankMiddleLayer();
        popMatrix();

        pushMatrix();
        multTranslation([0, 0.40, 0]);
        TankUpperL_Cabin();
        popMatrix();

        popMatrix();
    }



    function ground(uColorLocation, tilesX = 10, tilesZ = 10, tileSize = 0.5666666666666667) {


        const tileHeight = 0.03;

        const groundY = -tileHeight / 2;

        const whiteTile = [0.8, 0.8, 0.8];
        const darkTile = [0.5, 0.5, 0.5];

        for (let x = 0; x < tilesX; x++) {
            for (let z = 0; z < tilesZ; z++) {

                if ((x + z) % 2 == 0) { // coluna + linha para decidir a cor
                    gl.uniform3fv(uColorLocation, whiteTile);
                } else {
                    gl.uniform3fv(uColorLocation, darkTile);
                }

                //Corre para todos os tiles 
                pushMatrix();

                //Mover para a origem
                const offsetX = -(tilesX * tileSize) / 2 + tileSize / 2;
                const offsetZ = -(tilesZ * tileSize) / 2 + tileSize / 2;

                //translaçao para o sitio certo e escala
                multTranslation([x * tileSize + offsetX, groundY, z * tileSize + offsetZ]);
                multScale([tileSize, tileHeight, tileSize]);

                uploadModelView();
                CUBE.draw(gl, program, mode);

                popMatrix();
            }
        }
    }


    function render() {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);



        // Send the mProjection matrix to the GLSL program
        if (aspect > 1) {
            // WIDE
            mProjection = ortho(-viewSize * aspect * zoom, viewSize * aspect * zoom, -viewSize * zoom, viewSize * zoom, -10, 10);
        } else {
            // TALL
            mProjection = ortho(-viewSize * zoom, viewSize * zoom, -viewSize / aspect * zoom, viewSize / aspect * zoom, -10, 10);
        }

        uploadProjection();

        // Load the ModelView matrix with the Worl to Camera (View) matrix
        loadMatrix(mView);

        //new

        ground(uColorLocation, 11, 11, 0.5666666666666667);

        Tank();
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))