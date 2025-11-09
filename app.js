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
            mView: lookAt([0, 5, 0], [0, 0.3, 0], [0, 0, -1]),
            zoom: 1.0,
            viewSize: 1.0,
            isOblique: false,
            x: 0, y: 0, w: 0, h: 0
        },
        {
            // View 3 (Right View)
            mView: lookAt([0, 0.3, 5], [0, 0.3, 0], [0, 1, 0]),
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


    let wheelRotation = 0;

    let wireframeMode = 0;

    resize_canvas();
    window.addEventListener("resize", resize_canvas);

    canvas.addEventListener("wheel", function (event) {
        event.preventDefault();

        let zoomFactor;
        if (event.deltaY < 0) {
            zoom /= 1.1;
            zoomFactor = 1 / 1.1;
        } else {
            zoom *= 1.1;
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
                    overlayPanel.style.display = "block";
                }
                break;

            case '0':
                isSplitView = !isSplitView;
                isOblique = true;
                resize_canvas();
                break;
            case '1':
                mView = lookAt([-5, 0.3, 0.], [0, 0.3, 0], [0, 1, 0]);
                currentView = 1;
                viewSize = 0.8;
                isOblique = false;
                isSplitView = false;
                break;
            case '2':
                mView = lookAt([0, 0.3, 5], [0, 0.3, 0], [0, 1, 0])
                currentView = 2;
                viewSize = 1.0;
                isOblique = false;
                isSplitView = false;
                break;
            case '3':
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
                    ;
                }
                break;

            case 'ArrowUp':
                theta = Math.min(1.0, theta + 0.001);

                break;
            case 'ArrowDown':

                theta = Math.max(-1.0, theta - 0.001);

                break;
            case 'ArrowLeft':

                gamma = Math.max(-1.0, gamma - 0.001);

                break;
            case 'ArrowRight':

                gamma = Math.min(1.0, gamma + 0.001);

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
                rc = Math.max(-30, rc - 1);
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
            case ' ':
                wireframeMode = (wireframeMode + 1) % 3;
                event.preventDefault();
                break;
            case 'r':

                zoom = 1.0;
                if (isSplitView) {
                    viewports.forEach(v => {
                        v.zoom = 1.0;
                    });
                }
                gamma = 0.2;
                theta = 0.1;
                break;
        }
    }

    gl.clearColor(0.6, 0.7, 0.8, 1.0);
    gl.enable(gl.DEPTH_TEST);

    CUBE.init(gl);
    CYLINDER.init(gl);
    SPHERE.init(gl);
    TORUS.init(gl);

    window.requestAnimationFrame(render);

    function resize_canvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        aspect = canvas.width / canvas.height;

        if (isSplitView) {
            let w2 = Math.floor(canvas.width / 2);
            let h2 = Math.floor(canvas.height / 2);

            viewports[0].x = 0;
            viewports[0].y = 0;
            viewports[0].w = w2;
            viewports[0].h = h2;

            viewports[1].x = w2;
            viewports[1].y = 0;
            viewports[1].w = canvas.width - w2;
            viewports[1].h = h2;

            viewports[2].x = 0;
            viewports[2].y = h2;
            viewports[2].w = w2;
            viewports[2].h = canvas.height - h2;

            viewports[3].x = w2;
            viewports[3].y = h2;
            viewports[3].w = canvas.width - w2;
            viewports[3].h = canvas.height - h2;
        }
    }

    function drawScene() {
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

    /**
     * Base do tanque
     */
    function Base() {
        if (wireframeMode !== 2) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
            multScale([1.5, 0.16, 0.8]);
            uploadModelView();
            CUBE.draw(gl, program, gl.TRIANGLES);
            popMatrix();
        }

        if (wireframeMode !== 1) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
            multScale([1.501, 0.161, 0.801]);
            uploadModelView();
            CUBE.draw(gl, program, gl.LINES);
            popMatrix();
        }
    }

    /**
     * Camada do meio
     */
    function TankMiddleLayer() {
        if (wireframeMode !== 2) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
            multScale([1.6, 0.1, 0.9]);
            uploadModelView();
            CUBE.draw(gl, program, gl.TRIANGLES);
            popMatrix();
        }

        if (wireframeMode !== 1) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
            multScale([1.601, 0.101, 0.901]);
            uploadModelView();
            CUBE.draw(gl, program, gl.LINES);
            popMatrix();
        }
    }

    /**
     * Cabina superior
     */
    function TankUpperL_Cabin() {
        if (wireframeMode !== 2) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
            multScale([1.0, 0.24, 0.5]);
            uploadModelView();
            CUBE.draw(gl, program, gl.TRIANGLES);
            popMatrix();
        }

        if (wireframeMode !== 1) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
            multScale([1.001, 0.241, 0.501]);
            uploadModelView();
            CUBE.draw(gl, program, gl.LINES);
            popMatrix();
        }
    }

    function rotatinThingy() {
        if (wireframeMode !== 2) {
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
        }

        if (wireframeMode !== 1) {
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
        }

        Cannon();
    }

    function topHalfSphere() {
        if (wireframeMode !== 2) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
            multTranslation([0, 0.52, 0]);
            multScale([0.4, 0.2, 0.4]);
            multRotationX(180);
            uploadModelView();
            SPHERE.draw(gl, program, gl.TRIANGLES);
            popMatrix();
        }

        if (wireframeMode !== 1) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
            multTranslation([0, 0.52, 0]);
            multScale([0.401, 0.201, 0.401]);
            multRotationX(180);
            uploadModelView();
            SPHERE.draw(gl, program, gl.LINES);
            popMatrix();
        }
    }

    function topSphereComplement() {
        if (wireframeMode !== 2) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.7, 0.6, 0.35);
            multTranslation([0, 0.55, 0]);
            multScale([0.16, 0.16, 0.16]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.TRIANGLES);
            popMatrix();
        }

        if (wireframeMode !== 1) {
            pushMatrix();
            gl.uniform3f(uColorLocation, 0.3, 0.3, 0.3);
            multTranslation([0, 0.55, 0]);
            multScale([0.161, 0.161, 0.161]);
            uploadModelView();
            CYLINDER.draw(gl, program, gl.LINES);
            popMatrix();
        }
    }

    function wheels() {
        const numWheels = 6;
        const baseLength = 1.4;
        const baseWidth = 0.855;
        const localYCenter = 0.03;
        const wheelRadius = 0.15;
        const rimRadius = 0.10;
        const rimThickness = 0.05;

        const spacing = baseLength / numWheels;
        const startX = -baseLength / 2 + spacing / 2;
        const zPosRight = baseWidth / 2 - 0.004;
        const zPosLeft = -baseWidth / 2 + 0.004;

        for (let i = 0; i < numWheels; i++) {
            const xPos = startX + i * spacing;

            // Rodas Direitas
            pushMatrix();
            multTranslation([xPos, localYCenter, zPosRight]);
            multRotationX(90);
            multRotationY(wheelRotation);

            if (wireframeMode !== 2) {
                gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
                pushMatrix();
                multScale([wheelRadius, wheelRadius * 0.6, wheelRadius]);
                uploadModelView();
                TORUS.draw(gl, program, gl.TRIANGLES);
                popMatrix();
            }

            if (wireframeMode !== 1) {
                gl.uniform3f(uColorLocation, 0.4, 0.4, 0.4);
                pushMatrix();
                multScale([wheelRadius + 0.001, wheelRadius * 0.6 + 0.001, wheelRadius + 0.001]);
                uploadModelView();
                TORUS.draw(gl, program, gl.LINES);
                popMatrix();
            }

            if (wireframeMode !== 2) {
                gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
                pushMatrix();
                multScale([rimRadius, rimThickness * 0.6, rimRadius]);
                uploadModelView();
                CYLINDER.draw(gl, program, gl.TRIANGLES);
                popMatrix();
            }

            if (wireframeMode !== 1) {
                gl.uniform3f(uColorLocation, 0.25, 0.25, 0.25);
                pushMatrix();
                multScale([rimRadius + 0.001, rimThickness * 0.6 + 0.001, rimRadius + 0.001]);
                uploadModelView();
                CYLINDER.draw(gl, program, gl.LINES);
                popMatrix();
            }

            popMatrix();

            // Rodas Esquerdas
            pushMatrix();
            multTranslation([xPos, localYCenter, zPosLeft]);
            multRotationX(90);

            if (wireframeMode !== 2) {
                gl.uniform3f(uColorLocation, 0.2, 0.2, 0.2);
                pushMatrix();
                multScale([wheelRadius, wheelRadius * 0.6, wheelRadius]);
                uploadModelView();
                TORUS.draw(gl, program, gl.TRIANGLES);
                popMatrix();
            }

            if (wireframeMode !== 1) {
                gl.uniform3f(uColorLocation, 0.4, 0.4, 0.4);
                pushMatrix();
                multScale([wheelRadius + 0.001, wheelRadius * 0.6 + 0.001, wheelRadius + 0.001]);
                uploadModelView();
                TORUS.draw(gl, program, gl.LINES);
                popMatrix();
            }

            if (wireframeMode !== 2) {
                gl.uniform3f(uColorLocation, 0.5, 0.5, 0.5);
                pushMatrix();
                multScale([rimRadius, rimThickness * 0.6, rimRadius]);
                uploadModelView();
                CYLINDER.draw(gl, program, gl.TRIANGLES);
                popMatrix();
            }

            if (wireframeMode !== 1) {
                gl.uniform3f(uColorLocation, 0.7, 0.7, 0.7);
                pushMatrix();
                multScale([rimRadius + 0.001, rimThickness * 0.6 + 0.001, rimRadius + 0.001]);
                uploadModelView();
                CYLINDER.draw(gl, program, gl.LINES);
                popMatrix();
            }

            popMatrix();
        }
    }

    function Cannon() {
        if (wireframeMode !== 2) {
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
        }

        if (wireframeMode !== 1) {
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
    }

    function Tank() {
        pushMatrix();
        multTranslation([rg, 0.08, 0]);

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
        const whiteTileLine = [0.6, 0.6, 0.6];
        const darkTileLine = [0.3, 0.3, 0.3];

        for (let x = 0; x < tilesX; x++) {
            for (let z = 0; z < tilesZ; z++) {
                const isWhiteTile = (x + z) % 2 == 0;

                pushMatrix();
                const offsetX = -(tilesX * tileSize) / 2 + tileSize / 2;
                const offsetZ = -(tilesZ * tileSize) / 2 + tileSize / 2;
                multTranslation([x * tileSize + offsetX, groundY, z * tileSize + offsetZ]);
                multScale([tileSize, tileHeight, tileSize]);

                // Draw solid tiles
                if (wireframeMode !== 2) {
                    if (isWhiteTile) {
                        gl.uniform3fv(uColorLocation, whiteTile);
                    } else {
                        gl.uniform3fv(uColorLocation, darkTile);
                    }
                    uploadModelView();
                    CUBE.draw(gl, program, gl.TRIANGLES);
                }

                // Draw wireframe lines
                if (wireframeMode !== 1) {
                    if (isWhiteTile) {
                        gl.uniform3fv(uColorLocation, whiteTileLine);
                    } else {
                        gl.uniform3fv(uColorLocation, darkTileLine);
                    }
                    uploadModelView();
                    CUBE.draw(gl, program, gl.LINES);
                }

                popMatrix();
            }
        }
    }

    function render() {
        window.requestAnimationFrame(render);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.useProgram(program);

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
                let mv = v.mView;

                // Se for a 4ª vista E estiver em modo Oblíquo, aplica a distorção
                if (i == 3 && isOblique == true) {
                    const L = 0.5;
                    const alpha = 45 * Math.PI / 180;

                    let obliqueMatrix = mat4(
                        1.0, 0.0, 0.0, 0.0,
                        0.0, 1.0, 0.0, 0.0,
                        -L * Math.cos(alpha), -L * Math.sin(alpha), 1.0, 0.0,
                        0.0, 0.0, 0.0, 1.0
                    );
                    mP = mult(mP, obliqueMatrix);
                }

                uploadMatrix("u_projection", mP);
                loadMatrix(mv); // Carrega a vista

                // Se for a 4ª vista, aplica as rotações
                if (i == 3) {
                    // Se NÃO estiver em modo oblíquo (logo, está em Axonométrico)
                    if (isOblique == false) {
                        // Esta é a tua "matriz axonométrica"!
                        multRotationY(45);
                        multRotationX(35.264); // Ângulo isométrico clássico
                    }

                    // Aplica as rotações do utilizador (gamma/theta) EM AMBOS OS MODOS
                    let UpDown = gamma * 180.0;
                    let LeftRight = theta * 90.0;
                    multRotationY(UpDown);
                    multRotationX(LeftRight);
                }

                drawScene(); // Desenha a cena para esta viewport
            }
        }
        else {
            // --- MODO DE VISTA ÚNICA ---
            gl.viewport(0, 0, canvas.width, canvas.height);

            let mP;
            if (aspect > 1) {
                mP = ortho(-viewSize * aspect * zoom, viewSize * aspect * zoom, -viewSize * zoom, viewSize * zoom, -20, 20);
            } else {
                mP = ortho(-viewSize * zoom, viewSize * zoom, -viewSize / aspect * zoom, viewSize / aspect * zoom, -20, 20);
            }
            let mv = mView;

            // Se for a vista 4 E estiver em modo Oblíquo, aplica a distorção
            if (currentView === 4 && isOblique) {
                const L = 0.5;
                const alpha = 45 * Math.PI / 180;

                let obliqueMatrix = mat4(
                    1.0, 0.0, 0.0, 0.0,
                    0.0, 1.0, 0.0, 0.0,
                    -L * Math.cos(alpha), -L * Math.sin(alpha), 1.0, 0.0,
                    0.0, 0.0, 0.0, 1.0
                );
                mP = mult(mP, obliqueMatrix);
            }

            uploadMatrix("u_projection", mP);
            loadMatrix(mv);

            if (currentView === 4) {

                if (isOblique == false) {

                    multRotationY(45);
                    multRotationX(35.264);
                }

                let UpDown = gamma * 180.0;
                let LeftRight = theta * 90.0;
                multRotationY(UpDown);
                multRotationX(LeftRight);
            }


            drawScene();
        }
    }
}


const urls = ["shader.vert", "shader.frag"];
loadShadersFromURLS(urls).then(shaders => setup(shaders))