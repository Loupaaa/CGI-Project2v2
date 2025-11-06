import { buildProgramFromSources, loadShadersFromURLS, setupWebGL } from "../../libs/utils.js";
import { ortho, lookAt, flatten, perspective, mult, mat4 } from "../../libs/MV.js";
import { modelView, loadMatrix, multRotationX, multRotationY, multRotationZ, multScale, multTranslation, popMatrix, pushMatrix } from "../../libs/stack.js";

import * as CUBE from '../../libs/objects/cube.js';
import * as CYLINDER from '../../libs/objects/cylinder.js'
import * as SPHERE from '../../libs/objects/sphere.js'
import * as TORUS from '../../libs/objects/torus.js'



function setup(shaders) {
    let canvas = document.getElementById("gl-canvas");
    let overlayPanel = document.getElementById("overlay");
    let aspect = canvas.width / canvas.height;

    /** @type WebGL2RenderingContext */
    let gl = setupWebGL(canvas);

    let isSplitView = false;

    // Define four separate view configurations
    let viewports = [
        {
            // View 1 (Left View)
            mView: lookAt([-5, 0.3, 0], [0, 0.3, 0], [0, 1, 0]),
            zoom: 1.0,
            viewSize: 0.8,
            isOblique: false,
            // Viewport bounds in pixels (set in resize_canvas)
            x: 0, y: 0, w: 0, h: 0
        },
        {
            // View 2 (Top View)
            mView: lookAt([0, 5, 0], [0, 0.3, 0], [0, 0, -1]), // Adjusted 3 view to be the top view, and 2 to be the right view
            zoom: 1.0,
            viewSize: 1.0,
            isOblique: false,
            x: 0, y: 0, w: 0, h: 0
        },
        {
            // View 3 (Right View)
            mView: lookAt([0, 0.3, 5], [0, 0.3, 0], [0, 1, 0]), // Adjusted 2 view to be the right view
            zoom: 1.0,
            viewSize: 0.8,
            isOblique: false,
            x: 0, y: 0, w: 0, h: 0
        },
        {
            // View 4 (Perspective View)
            mView: lookAt([2, 1.2, 5], [0, 0.3, 0], [0, 1, 0]),
            zoom: 1.0,
            viewSize: 1.5,
            isOblique: false,
            x: 0, y: 0, w: 0, h: 0
        }
    ];



    // Drawing mode (gl.LINES or gl.TRIANGLES)
    let mode = gl.TRIANGLES;

    let program = buildProgramFromSources(gl, shaders["shader.vert"], shaders["shader.frag"]);

    let uColorLocation = gl.getUniformLocation(program, "u_color");

    let mProjection = ortho(-1 * aspect, aspect, -1, 1, -10, 10);
    let mView = lookAt([2, 1.2, 5], [0, 0, 0], [0, 1, 0]);


    let currentView = 1;
    let isOblique = false;



    let zoom = 1.0;

    let viewSize = 0.8;



    let gamma = 0.2;
    let theta = 0.1;

    let ag = 0;
    let rg = 0;
    let rb = 0;
    let rc = 0;

    // let tomatoes = [];
    // const TOMATO_SPEED = 2.0;


    let wheelRotation = 0;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();

        let zoomFactor;
        if (event.deltaY < 0) {
            // Zoom In
            zoom /= 1.1; // Divide by 1.1
            zoomFactor = 1 / 1.1;
        } else {
            // Zoom Out
            zoom *= 1.1; // Multiply by 1.1
            zoomFactor = 1.1;
        }

        if (isSplitView) {
            viewports.forEach(v => {
                v.zoom *= zoomFactor;
            });
        } else {

            resize_canvas();
        }
    });

    document.onkeydown = function (event) {
        switch (event.key) {
            case 'h':
                if (overlayPanel.style.display === "none") {
                    overlayPanel.style.display = "block"; // Show the panel
                } else {
                    overlayPanel.style.display = "none";  // Hide the panel
                }
                break;

            case '0':
                isSplitView = !isSplitView;
                isOblique = true;
                resize_canvas(); // Re-calculate viewport dimensions
                break;
            case '1':
                mView = lookAt([-5, 0.3, 0.], [0, 0.3, 0], [0, 1, 0]);
                currentView = 1;
                viewSize = 0.8;
                isOblique = false;
                isSplitView = false;
                break;
            case '2':
                // Top view
                mView = lookAt([0, 0.3, 5], [0, 0.3, 0], [0, 1, 0])
                currentView = 2;
                viewSize = 1.0;
                isOblique = false;
                isSplitView = false;
                break;
            case '3':
                // Right view 
                mView = lookAt([0, 5, 0], [0, 0.3, 0], [0, 0, -1])
                currentView = 3;
                viewSize = 0.8;
                isOblique = false;
                isSplitView = false;
                break;
            case '4':
                mView = lookAt([2, 1.2, 5], [0, 0.3, 0], [0, 1, 0]);
                viewSize = 1.5;
                currentView = 4;
                isOblique = true;
                isSplitView = false;
                break;

            case '8':
                if (currentView == 4) {
                    isOblique = !isOblique;
                }
                break;
            case '9':
                if (currentView == 4) {
                    isOblique = !isOblique;
                }
                break;
            case '//':
                if (currentView == 4) {
                    isOblique = !isOblique;
                }
                break;

            case 'ArrowUp':
                if (isOblique) { // Check if we are in the special mode
                    theta = Math.min(1.0, theta + 0.001);
                }
                event.preventDefault()
                break;
            case 'ArrowDown':
                if (isOblique) { // Check if we are in the special mode
                    theta = Math.max(-1.0, theta - 0.001);
                }
                event.preventDefault()
                break;
            case 'ArrowLeft':
                if (isOblique) { // Check if we are in the special mode
                    gamma = Math.max(-1.0, gamma - 0.001);
                }
                event.preventDefault()
                break;
            case 'ArrowRight':
                if (isOblique) { // Check if we are in the special mode
                    gamma = Math.min(1.0, gamma + 0.001);
                }
                event.preventDefault()
                break;
            case 'q':
                rg -= 0.01;
                wheelRotation -= 15;
                break;
            case 'e':
                rg += 0.01;
                wheelRotation += 15;
                break;
            case 'w':
                rc = Math.max(-30, rc - 1); //here the first number is max angle it can go in the animation 
                break;
            case 's':
                rc = Math.min(60, rc + 1);
                break;
            case 'a':
                rb = Math.min(40, rb + 1);
                break;
            case 'd':
                rb = Math.max(-40, rb - 1);
                break;
            case 'z':
                shootTomatoes();
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
        aspect = canvas.width / canvas.height; // Keep global aspect for single-view mode

        if (isSplitView) {
            // Calculate 4-quadrant dimensions
            let w2 = Math.floor(canvas.width / 2);
            let h2 = Math.floor(canvas.height / 2);

            // View 1 (Bottom-Left)
            viewports[0].x = 0;
            viewports[0].y = 0;
            viewports[0].w = w2;
            viewports[0].h = h2;

            // View 2 (Bottom-Right)
            viewports[1].x = w2;
            viewports[1].y = 0;
            viewports[1].w = canvas.width - w2;
            viewports[1].h = h2;

            // View 3 (Top-Left)
            viewports[2].x = 0;
            viewports[2].y = h2;
            viewports[2].w = w2;
            viewports[2].h = canvas.height - h2;

            // View 4 (Top-Right)
            viewports[3].x = w2;
            viewports[3].y = h2;
            viewports[3].w = canvas.width - w2;
            viewports[3].h = canvas.height - h2;
        }
        // In single-view mode, the render() function will handle setting the gl.viewport
    }
    /**
     * Draws all models in the scene.
     */
    function drawScene() {
        // createTomatoes();
        ground(uColorLocation, 11, 11, 0.5666666666666667);
        Tank();
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

    // function createTomatoes() {
    //     for (let i = 0; i < tomatoes.length; i++) {
    //         const tomato = tomatoes[i];

    //         pushMatrix();

    //         gl.uniform3f(uColorLocation, 1.0, 0.2, 0.2);
    //         multTranslation([tomato.x, tomato.y, tomato.z]);
    //         multScale([0.05, 0.05, 0.05]);

    //         uploadModelView();
    //         SPHERE.draw(gl, program, gl.TRIANGLES);

    //         popMatrix();
    //     }
    // }

    // function shootTomatoes() {
    //     const cannonInfo = getTomatoInitPosition();

    //     const Tomato = {
    //         x: cannonInfo.tipX,
    //         y: cannonInfo.tipY,
    //         z: cannonInfo.tipZ,
    //         speedX: cannonInfo.dirX * TOMATO_SPEED,
    //         speedY: cannonInfo.dirY * TOMATO_SPEED,
    //         speedZ: cannonInfo.dirZ * TOMATO_SPEED,
    //         alive: 5.0
    //     };

    //     tomatoes.push(Tomato);
    // }

    // function animateTomatoes() {
    //     const gravityAceleration = -0.98;
    //     const deltaTime = 0.016;

    //     for (let i = tomatoes.length - 1; i >= 0; i--) {
    //         const tomato = tomatoes[i];

    //         tomato.x += tomato.speedX * deltaTime;
    //         tomato.y += tomato.speedY * deltaTime;
    //         tomato.z += tomato.speedZ * deltaTime;

    //         tomato.speedY += gravityAceleration * deltaTime;

    //         tomato.timeAlive -= deltaTime;

    //         if (tomato.y < 0 || tomato.alive <= 0) {
    //             tomatoes.splice(i, 1);
    //         }
    //     }
    // }


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

        multRotationZ(rc);

        multRotationX(90);
        multScale([0.12, 0.12, 0.12]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.TRIANGLES);

        popMatrix();


        pushMatrix();

        gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);


        multTranslation([0, -0.32, 0]);

        multTranslation([-0.5, 0.5, 0]);

        multRotationZ(rc);

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
            multRotationY(wheelRotation);


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


        multTranslation([0, -0.32, 0]);
        multTranslation([-0.5, 0.5, 0]);


        multRotationZ(rc);


        multRotationZ(45);
        multTranslation([0, 0.6, 0]);

        multScale([0.025, 1.2, 0.025]);
        uploadModelView();
        CYLINDER.draw(gl, program, gl.TRIANGLES);

        popMatrix();

        pushMatrix();

        gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);


        multTranslation([0, -0.32, 0]);
        multTranslation([-0.5, 0.5, 0]);
        multRotationZ(rc);
        multRotationZ(45);
        multTranslation([0, 0.6, 0]);

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
        multTranslation([rg, 0.08, 0]);

        // FIXED PARTS when rotating with A and D 
        pushMatrix();
        multTranslation([0, 0.1, 0]);
        Base();
        popMatrix();

        pushMatrix();
        wheels();
        popMatrix();

        pushMatrix();
        multTranslation([0, 0.23, 0]);
        TankMiddleLayer();
        popMatrix();

        // Everything from here rotates with A and D
        pushMatrix();

        multRotationY(rb);


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
        multTranslation([0, 0.40, 0]);
        TankUpperL_Cabin();
        popMatrix();

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

        // Animate physics once per frame
        // animateTomatoes();

        if (isSplitView) {

            for (let i = 0; i < viewports.length; i++) {
                let v = viewports[i];


                gl.viewport(v.x, v.y, v.w, v.h);


                let vpAspect = v.w / v.h;
                let vSize = v.viewSize;
                let vZoom = v.zoom;

                let mP;
                if (vpAspect > 1) {
                    mP = ortho(-vSize * vpAspect * vZoom, vSize * vpAspect * vZoom, -vSize * vZoom, vSize * vZoom, -20, 20);
                } else {
                    mP = ortho(-vSize * vZoom, vSize * vZoom, -vSize / vpAspect * vZoom, vSize / vpAspect * vZoom, -20, 20);
                }
                let mv = mView;


                if (i == 3 && isOblique == true) { // Se for a Vista 4
                    if (isOblique) { // E o modo oblíquo/spin estiver ATIVO

                        // A. APLICAR O SHEAR OBLÍQUO (da slide)
                        const L = 0.5;
                        const alpha = 45 * Math.PI / 180;

                        let obliqueMatrix = mat4(
                            1.0, 0.0, 0.0, 0.0,
                            0.0, 1.0, 0.0, 0.0,
                            -L * Math.cos(alpha), -L * Math.sin(alpha), 1.0, 0.0,
                            0.0, 0.0, 0.0, 1.0
                        );
                        mP = mult(mP, obliqueMatrix); // Modifica a projeção 'mP'

                        // B. APLICAR O "SPIN" DA CÂMARA (o que você quer)
                        const R = 5.0;
                        const at = [0, 0.3, 0];

                        let azimuth = gamma * Math.PI;
                        let elevation = theta * Math.PI / 2;

                        let eyeX = at[0] + R * Math.cos(elevation) * Math.sin(azimuth);
                        let eyeY = at[1] + R * Math.sin(elevation);
                        let eyeZ = at[2] + R * Math.cos(elevation) * Math.cos(azimuth);

                        if (eyeY < -R + 0.01) eyeY = -R + 0.01;

                        mv = lookAt([eyeX, eyeY, eyeZ], at, [0, 1, 0]); // Recalcula a 'mv'
                    }
                }
                uploadMatrix("u_projection", mP);
                loadMatrix(mv);
                drawScene();
            }
        } else {

            gl.viewport(0, 0, canvas.width, canvas.height);

            let mP;
            if (aspect > 1) {
                mP = ortho(-viewSize * aspect * zoom, viewSize * aspect * zoom, -viewSize * zoom, viewSize * zoom, -20, 20);
            } else {
                mP = ortho(-viewSize * zoom, viewSize * zoom, -viewSize / aspect * zoom, viewSize / aspect * zoom, -20, 20);
            }
            let mv = mView;


            if (currentView === 4) {
                if (isOblique) {

                    // copia dos slides
                    const L = 0.5;
                    const alpha = 45 * Math.PI / 180;

                    let obliqueMatrix = mat4(
                        1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        -L * Math.cos(alpha), -L * Math.sin(alpha), 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0
                    );
                    mP = mult(mP, obliqueMatrix); // Modifica a projeção 'mP'

                    // B. APLICAR O "SPIN" DA CÂMARA (o que você quer)
                    const R = 5.0;
                    const at = [0, 0.3, 0];

                    let side = gamma * Math.PI;
                    let elevation = theta * Math.PI / 2;

                    let eyeX = at[0] + R * Math.cos(elevation) * Math.sin(side);
                    let eyeY = at[1] + R * Math.sin(elevation);
                    let eyeZ = at[2] + R * Math.cos(elevation) * Math.cos(side);

                    if (eyeY < -R + 0.01) eyeY = -R + 0.01;

                    mv = lookAt([eyeX, eyeY, eyeZ], at, [0, 1, 0]); // Recalcula a 'mv'
                }
            }
            // --- FIM DA LÓGICA CORRIGIDA ---

            // 3. Upload das matrizes e desenhar
            uploadMatrix("u_projection", mP);
            loadMatrix(mv);
            drawScene();
        }
    }
}

const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))