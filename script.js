//=================================== Configurações do jogo =========================
const ROAD_WIDTH = 24; // Largura da pista
const LANE_WIDTH = ROAD_WIDTH / 6; // Largura de cada faixa da pista
const CAR_WIDTH = 1.8; // Largura do carro do jogador
const CAR_LENGTH = 4.5; // Comprimento do carro do jogador
const CAR_HEIGHT = 1.5; // Altura do carro do jogador
const SEGMENT_LENGTH = 100; // Comprimento de cada segmento da pista
const PLAYER_START_Z = 5; // Posição inicial do carro do jogador no eixo Z

//=================================== Variáveis do jogo =========================
let scene, camera, renderer, car, pistaModelo; // Cena, câmera, renderizador, carro do jogador, modelo da pista
let gameActive = false; // Indica se o jogo está ativo ou não
let clock = new THREE.Clock(); // Relógio para controlar o tempo do jogo
let trafficCars = []; // Array para armazenar os carros do tráfego
let lastCarSpawnTime = 0; // Tempo da última geração de carro do tráfego
let carSpawnInterval = 500; // Intervalo entre a geração de carros do tráfego
let moveDirection = 0; // Direção do movimento do carro do jogador (-1: esquerda, 1: direita, 0: parado)
let currentLane = 3; // Faixa atual do carro do jogador
let targetCarPositionX = 0; // Posição alvo do carro do jogador no eixo X
let playerSpeed = 0.2; // Velocidade do carro do jogador
let accelerating = false; // Indica se o carro do jogador está acelerando
let braking = false; // Indica se o carro do jogador está freando
let segmentosPista = []; // Array para armazenar os segmentos da pista
let pontuacao = 0; // Pontuação do jogador
let faseAtual = 1; // Fase atual do jogo
let faseExibida = false; // Indica se a mensagem da fase atual já foi exibida
let carrosUltrapassados = []; // Array para armazenar os carros do tráfego que o jogador ultrapassou
let selectedCar = 'car1.glb'; // Modelo do carro selecionado pelo jogador
let girando = false; // Indica se o carro do jogador está girando
let rotacaoHabilitada = true; // Indica se a rotação do carro está habilitada

//=================================== Elementos da UI =========================
const menu = document.getElementById('menu'); // Elemento do menu principal
const carSelection = document.getElementById('car-selection'); // Elemento da seleção de carros
const selecionarCarroBtn = document.getElementById('selecionar-carro'); // Botão para selecionar o carro
const iniciarJogoBtn = document.getElementById('iniciar-jogo'); // Botão para iniciar o jogo
const confirmarCarroBtn = document.getElementById('confirmar-carro'); // Botão para confirmar a seleção do carro
const cancelarSelecaoBtn = document.getElementById('cancelar-selecao'); // Botão para cancelar a seleção do carro
const carItems = document.querySelectorAll('.car-item'); // Elementos dos carros na seleção de carros
const gameOverScreen = document.getElementById('game-over'); // Tela de game over
const recomecarJogoBtn = document.getElementById('recomecar-jogo'); // Botão para recomeçar o jogo
const voltarMenuBtn = document.getElementById('voltar-menu'); // Botão para voltar ao menu principal
const pontuacaoFinal = document.getElementById('pontuacao-final'); // Pontuação final exibida na tela de game over

//=================================== Elementos de áudio =========================
const backgroundMusic = document.getElementById('background-music'); // Música de fundo
const crashSound = document.getElementById('crash-sound'); // Som de colisão
const engineSound = document.getElementById('engine-sound'); // Som do motor
const phaseSound = document.getElementById('phase-sound'); // Som de fase completa
const catSound = document.getElementById('catSound'); // Som do buzina

//=================================== Event Listeners =========================
selecionarCarroBtn.addEventListener('click', () => { // Ao clicar no botão "Selecionar Carro"
    menu.style.opacity = '0'; // Define a opacidade do menu para 0
    setTimeout(() => { // Após 300ms
        menu.style.display = 'none'; // Oculta o menu
        carSelection.classList.add('active'); // Exibe a seleção de carros
    }, 300);
});

cancelarSelecaoBtn.addEventListener('click', () => { // Ao clicar no botão "Cancelar" na seleção de carros
    carSelection.classList.remove('active'); // Oculta a seleção de carros
    setTimeout(() => { // Após 300ms
        menu.style.display = 'flex'; // Exibe o menu
        setTimeout(() => { // Após 10ms
            menu.style.opacity = '1'; // Define a opacidade do menu para 1
        }, 10);
    }, 300);
});

confirmarCarroBtn.addEventListener('click', () => { // Ao clicar no botão "Confirmar" na seleção de carros
    carSelection.classList.remove('active'); // Oculta a seleção de carros
    iniciarJogoBtn.disabled = false; // Habilita o botão "Iniciar Jogo"
    setTimeout(() => { // Após 300ms
        menu.style.display = 'flex'; // Exibe o menu
        setTimeout(() => { // Após 10ms
            menu.style.opacity = '1'; // Define a opacidade do menu para 1
        }, 10);
    }, 300);
});

iniciarJogoBtn.addEventListener('click', iniciarJogo); // Ao clicar no botão "Iniciar Jogo", inicia o jogo

carItems.forEach(item => { // Para cada item da seleção de carros
    item.addEventListener('click', () => { // Ao clicar em um carro
        carItems.forEach(i => i.classList.remove('selected')); // Remove a classe "selected" de todos os carros
        item.classList.add('selected'); // Adiciona a classe "selected" ao carro clicado
        selectedCar = item.dataset.car; // Define o modelo do carro selecionado
    });
});

recomecarJogoBtn.addEventListener('click', () => { // Ao clicar no botão "Jogar Novamente" na tela de game over
    gameOverScreen.style.display = 'none'; // Oculta a tela de game over
    reiniciarJogo(); // Reinicia o jogo
});

voltarMenuBtn.addEventListener('click', () => { // Ao clicar no botão "Voltar ao Menu" na tela de game over
    gameOverScreen.style.display = 'none'; // Oculta a tela de game over
    menu.style.display = 'flex'; // Exibe o menu principal
    setTimeout(() => { // Após 10ms
        menu.style.opacity = '1'; // Define a opacidade do menu para 1
    }, 10);
});

//=================================== Funções do jogo =========================
function iniciarJogo() { // Função para iniciar o jogo
    menu.style.display = 'none'; // Oculta o menu principal
    document.getElementById('game-container').style.display = 'block'; // Exibe o container do jogo
    document.getElementById('velocimetro').style.display = 'block'; // Exibe o velocímetro
    document.getElementById('pontuacao').style.display = 'block'; // Exibe a pontuação

    setupScene(); // Configura a cena 3D
    loadPistaModelo(); // Carrega o modelo da pista
    loadCarModel(selectedCar); // Carrega o modelo do carro selecionado
    setupEventListeners(); // Configura os event listeners
    gameActive = true; // Define o jogo como ativo

    // Iniciar música e sons
    backgroundMusic.volume = 0.3; // Define o volume da música de fundo
    backgroundMusic.play(); // Inicia a música de fundo
    engineSound.volume = 0.2; // Define o volume do som do motor
    engineSound.play(); // Inicia o som do motor

    animate(); // Inicia o loop de animação
}

function reiniciarJogo() { // Função para reiniciar o jogo
    // Limpar cena
    while (scene.children.length > 0) { // Enquanto houver objetos na cena
        scene.remove(scene.children[0]); // Remove o primeiro objeto da cena
    }

    // Resetar variáveis
    trafficCars = []; // Limpa o array de carros do tráfego
    pontuacao = 0; // Reseta a pontuação
    faseAtual = 1; // Reseta a fase atual
    carrosUltrapassados = []; // Limpa o array de carros ultrapassados
    playerSpeed = 0.2; // Reseta a velocidade do carro
    moveDirection = 0; // Reseta a direção do movimento do carro
    accelerating = false; // Reseta o estado de aceleração
    braking = false; // Reseta o estado de frenagem
    girando = false; // Reseta o estado de rotação
    rotacaoHabilitada = true; // Reseta a habilitação de rotação

    // Atualizar UI
    document.getElementById('pontuacao').textContent = `Pontuação: 0`; // Reseta a pontuação exibida
    document.getElementById('velocimetro').textContent = `Velocidade: 0 km/h`; // Reseta a velocidade exibida

    // Recriar cena
    setupScene(); // Configura a cena 3D
    loadPistaModelo(); // Carrega o modelo da pista
    loadCarModel(selectedCar); // Carrega o modelo do carro selecionado
    gameActive = true; // Define o jogo como ativo

    // Reiniciar música e sons
    backgroundMusic.currentTime = 0; // Reseta o tempo da música de fundo
    backgroundMusic.play(); // Inicia a música de fundo
    engineSound.currentTime = 0; // Reseta o tempo do som do motor
    engineSound.play(); // Inicia o som do motor

    animate(); // Inicia o loop de animação
}

function setupScene() { // Função para configurar a cena 3D
    scene = new THREE.Scene(); // Cria uma nova cena
    scene.background = new THREE.Color(0x87CEEB); // Define a cor de fundo da cena
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000); // Cria uma nova câmera
    camera.position.set(0, 1, 10); // Define a posição da câmera
    renderer = new THREE.WebGLRenderer({ antialias: true }); // Cria um novo renderizador
    renderer.setSize(window.innerWidth, window.innerHeight); // Define o tamanho do renderizador
    document.getElementById('game-container').appendChild(renderer.domElement); // Adiciona o renderizador ao container do jogo

    // Iluminação
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Cria uma luz ambiente
    scene.add(ambientLight); // Adiciona a luz ambiente à cena
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8); // Cria uma luz direcional
    directionalLight.position.set(100, 100, 50); // Define a posição da luz direcional
    scene.add(directionalLight); // Adiciona a luz direcional à cena
}

function loadPistaModelo() { // Função para carregar o modelo da pista
    const loader = new THREE.GLTFLoader(); // Cria um novo carregador de modelos GLTF
    const pistaPath = 'assets/3D_Models/pista.glb'; // Caminho do modelo da pista

    loader.load(pistaPath, // Carrega o modelo da pista
        (gltf) => { // Função de callback de sucesso
            pistaModelo = gltf.scene; // Armazena o modelo da pista
            segmentosPista.push(pistaModelo); // Adiciona o modelo da pista ao array de segmentos
            scene.add(pistaModelo); // Adiciona o modelo da pista à cena
        },
        
    );
}

function loadCarModel(carModel) { // Função para carregar o modelo do carro
    const loader = new THREE.GLTFLoader(); // Cria um novo carregador de modelos GLTF
    const carPath = `assets/3D_Models/${carModel}`; // Caminho do modelo do carro

    loader.load(carPath, // Carrega o modelo do carro
        (gltf) => { // Função de callback de sucesso
            if (car) scene.remove(car); // Remove o carro anterior da cena, se existir
            car = gltf.scene; // Armazena o modelo do carro
            const bbox = new THREE.Box3().setFromObject(car); // Cria uma caixa delimitadora para o carro
            const size = bbox.getSize(new THREE.Vector3()); // Obtém o tamanho da caixa delimitadora
            const scaleX = CAR_WIDTH / size.x; // Calcula a escala do carro no eixo X
            const scaleY = CAR_HEIGHT / size.y; // Calcula a escala do carro no eixo Y
            const scaleZ = CAR_LENGTH / size.z; // Calcula a escala do carro no eixo Z
            car.scale.set(scaleX, scaleY, scaleZ); // Define a escala do carro
            car.rotation.y = Math.PI; // Rotaciona o carro em 180 graus
            car.position.set(0, 0.5, PLAYER_START_Z); // Define a posição inicial do carro
            scene.add(car); // Adiciona o carro à cena
        },
         // Função de callback de progresso
        
    );
}

function setupEventListeners() { // Função para configurar os event listeners
    window.addEventListener('resize', onWindowResize); // Adiciona um event listener para o evento de redimensionamento da janela
    window.addEventListener('keydown', onKeyDown); // Adiciona um event listener para o evento de tecla pressionada
    window.addEventListener('keyup', onKeyUp); // Adiciona um event listener para o evento de tecla liberada
}

function onWindowResize() { // Função para lidar com o evento de redimensionamento da janela
    camera.aspect = window.innerWidth / window.innerHeight; // Atualiza a proporção da câmera
    camera.updateProjectionMatrix(); // Atualiza a matriz de projeção da câmera
    renderer.setSize(window.innerWidth, window.innerHeight); // Atualiza o tamanho do renderizador
}

function onKeyDown(event) { // Função para lidar com o evento de tecla pressionada
    if (!gameActive) return; // Se o jogo não estiver ativo, retorna
    switch (event.key.toLowerCase()) { // Verifica qual tecla foi pressionada
        case 'a': moveDirection = -1; break; // Se a tecla 'a' foi pressionada, move o carro para a esquerda
        case 'd': moveDirection = 1; break; // Se a tecla 'd' foi pressionada, move o carro para a direita
        case 'w': accelerating = true; break; // Se a tecla 'w' foi pressionada, acelera o carro
        case 's': braking = true; break; // Se a tecla 's' foi pressionada, freia o carro
        case 'ç': // Se a tecla 'ç' foi pressionada
            if (rotacaoHabilitada) { // Se a rotação do carro estiver habilitada
                catSound.currentTime = 0; // Reseta o tempo do som da buzina
                catSound.play(); // Toca o som da buzina
                girando = true; // Inicia a rotação do carro
                rotacaoHabilitada = false; // Desabilita a rotação do carro
            }
            break;
    }
}

function onKeyUp(event) { // Função para lidar com o evento de tecla liberada
    switch (event.key.toLowerCase()) { // Verifica qual tecla foi liberada
        case 'a': case 'd': moveDirection = 0; break; // Se a tecla 'a' ou 'd' foi liberada, para o movimento do carro
        case 'w': accelerating = false; break; // Se a tecla 'w' foi liberada, para a aceleração do carro
        case 's': braking = false; break; // Se a tecla 's' foi liberada, para a frenagem do carro
    }
}

function gerarSegmentoPista() { // Função para gerar um novo segmento da pista
    const novoSegmento = pistaModelo.clone(); // Clona o modelo da pista
    const ultimoSegmento = segmentosPista[segmentosPista.length - 1]; // Obtém o último segmento da pista
    novoSegmento.position.z = ultimoSegmento.position.z - SEGMENT_LENGTH * 2; // Define a posição do novo segmento
    segmentosPista.push(novoSegmento); // Adiciona o novo segmento ao array de segmentos
    scene.add(novoSegmento); // Adiciona o novo segmento à cena
}

function reutilizarSegmentoPista() { // Função para reutilizar um segmento da pista
    const segmento = segmentosPista.shift(); // Remove o primeiro segmento da pista do array
    segmentosPista.push(segmento); // Adiciona o segmento removido ao final do array
    const ultimoSegmento = segmentosPista[segmentosPista.length - 2]; // Obtém o penúltimo segmento da pista
    segmento.position.z = ultimoSegmento.position.z - SEGMENT_LENGTH * 2; // Define a posição do segmento reutilizado
}

function createTrafficCar() { // Função para criar um carro de tráfego
    const lane = Math.floor(Math.random() * 3); // Gera uma faixa aleatória para o carro de tráfego
    const xPos = -ROAD_WIDTH / 2 + LANE_WIDTH / 2 + lane * LANE_WIDTH; // Calcula a posição X do carro de tráfego
    const zPos = camera.position.z - 200; // Calcula a posição Z do carro de tráfego
    spawnCar(xPos, zPos, true, lane); // Gera o carro de tráfego
}

function spawnCar(xPos, zPos, isOppositeDirection, lane) { // Função para gerar um carro de tráfego
    const carModels = ['car2.glb', 'car3.glb', 'car4.glb', 'car5.glb', 'car6.glb']; // Array de modelos de carros de tráfego
    const randomCarModel = carModels[Math.floor(Math.random() * carModels.length)]; // Seleciona um modelo de carro aleatório
    const carPath = `assets/3D_Models/${randomCarModel}`; // Caminho do modelo do carro de tráfego

    const loader = new THREE.GLTFLoader(); // Cria um novo carregador de modelos GLTF
    loader.load(carPath, // Carrega o modelo do carro de tráfego
        (gltf) => { // Função de callback de sucesso
            const trafficCar = gltf.scene; // Armazena o modelo do carro de tráfego
            const bbox = new THREE.Box3().setFromObject(trafficCar); // Cria uma caixa delimitadora para o carro de tráfego
            const size = bbox.getSize(new THREE.Vector3()); // Obtém o tamanho da caixa delimitadora
            const scaleX = CAR_WIDTH / size.x; // Calcula a escala do carro de tráfego no eixo X
            const scaleY = CAR_HEIGHT / size.y; // Calcula a escala do carro de tráfego no eixo Y
            const scaleZ = CAR_LENGTH / size.z; // Calcula a escala do carro de tráfego no eixo Z
            trafficCar.scale.set(scaleX, scaleY, scaleZ); // Define a escala do carro de tráfego
            trafficCar.position.set(xPos, 0.5, zPos); // Define a posição do carro de tráfego

            trafficCar.userData = { // Armazena dados do carro de tráfego
                isOppositeDirection: isOppositeDirection, // Indica se o carro de tráfego está na direção oposta
                speed: isOppositeDirection ? 0.5 : 0.3, // Velocidade do carro de tráfego
                lane: lane // Faixa do carro de tráfego
            };

            scene.add(trafficCar); // Adiciona o carro de tráfego à cena
            trafficCars.push(trafficCar); // Adiciona o carro de tráfego ao array de carros de tráfego

            if (isOppositeDirection) { // Se o carro de tráfego estiver na direção oposta
                trafficCar.rotation.y = Math.PI; // Rotaciona o carro de tráfego em 180 graus
            }
        },
        
    );
}

function checkCollisions() { // Função para verificar colisões
    if (!car || !gameActive) return; // Se o carro do jogador não existir ou o jogo não estiver ativo, retorna

    const playerBox = new THREE.Box3().setFromObject(car); // Cria uma caixa delimitadora para o carro do jogador

    for (let i = 0; i < trafficCars.length; i++) { // Para cada carro de tráfego
        const trafficCar = trafficCars[i]; // Obtém o carro de tráfego
        const trafficBox = new THREE.Box3().setFromObject(trafficCar); // Cria uma caixa delimitadora para o carro de tráfego

        if (playerBox.intersectsBox(trafficBox)) { // Se o carro do jogador colidir com o carro de tráfego
            gameOver(); // Finaliza o jogo
            return; // Retorna
        }
    }
}

function gameOver() { // Função para finalizar o jogo
    gameActive = false; // Define o jogo como inativo
    pontuacaoFinal.textContent = `Pontuação: ${pontuacao}`; // Exibe a pontuação final
    gameOverScreen.style.display = 'flex'; // Exibe a tela de game over

    // Criar efeito de explosão
    createExplosion(car.position.x, car.position.y, car.position.z); // Cria um efeito de explosão na posição do carro do jogador

    // Parar música e tocar som de colisão
    backgroundMusic.pause(); // Pausa a música de fundo
    engineSound.pause(); // Pausa o som do motor
    crashSound.currentTime = 0; // Reseta o tempo do som de colisão
    crashSound.play(); // Toca o som de colisão
}

function createExplosion(x, y, z) { // Função para criar um efeito de explosão
    const explosion = document.createElement('div'); // Cria um novo elemento div para a explosão
    explosion.className = 'explosion'; // Define a classe do elemento div como "explosion"
    explosion.style.left = `${(x + ROAD_WIDTH / 2) / ROAD_WIDTH * 100}%`; // Define a posição X da explosão
    explosion.style.top = `${50 - (z - camera.position.z) * 0.5}%`; // Define a posição Y da explosão
    document.getElementById('game-container').appendChild(explosion); // Adiciona a explosão ao container do jogo

    // Remover após a animação
    setTimeout(() => { // Após 1000ms
        explosion.remove(); // Remove a explosão
    }, 1000);
}

function atualizarPontuacao() { // Função para atualizar a pontuação
    document.getElementById('pontuacao').textContent = `Pontuação: ${pontuacao}`; // Atualiza a pontuação exibida

    if (pontuacao % 25 === 0 && !faseExibida) { // Se a pontuação for múltipla de 25 e a mensagem da fase atual não tiver sido exibida
        faseAtual++; // Incrementa a fase atual
        exibirMensagemFase(); // Exibe a mensagem da fase atual
        faseExibida = true; // Define a mensagem da fase atual como exibida
    } else if (pontuacao % 25 !== 0) { // Se a pontuação não for múltipla de 25
        faseExibida = false; // Define a mensagem da fase atual como não exibida
    }
}

function exibirMensagemFase() { // Função para exibir a mensagem da fase atual
    const mensagemFase = document.getElementById('fase'); // Obtém o elemento da mensagem da fase
    mensagemFase.textContent = `Fase ${faseAtual}!`; // Define o texto da mensagem da fase
    mensagemFase.style.display = 'block'; // Exibe a mensagem da fase

    // Tocar som de fase completa
    phaseSound.currentTime = 0; // Reseta o tempo do som da fase completa
    phaseSound.play(); // Toca o som da fase completa

    setTimeout(() => { // Após 2000ms
        mensagemFase.style.display = 'none'; // Oculta a mensagem da fase
    }, 2000);
}

function animate() { // Função para animar o jogo
    requestAnimationFrame(animate); // Solicita o próximo frame de animação

    if (gameActive) { // Se o jogo estiver ativo
        const deltaTime = clock.getDelta(); // Obtém o tempo decorrido desde o último frame
        const currentTime = Date.now(); // Obtém o tempo atual

        // Movimento do carro do jogador
        if (moveDirection !== 0) { // Se o carro do jogador estiver se movendo
            targetCarPositionX += moveDirection * 0.1 * deltaTime * 60; // Calcula a nova posição X do carro do jogador
            targetCarPositionX = Math.max(-ROAD_WIDTH / 2 + CAR_WIDTH / 2 + 0.5, // Limita a posição X do carro do jogador
                Math.min(ROAD_WIDTH / 2 - CAR_WIDTH / 2 - 0.5, targetCarPositionX)); // Limita a posição X do carro do jogador
        }

        if (car) { // Se o carro do jogador existir
            car.position.x = THREE.MathUtils.lerp(car.position.x, targetCarPositionX, 0.1); // Move o carro do jogador para a posição X alvo

            if (accelerating) { // Se o carro do jogador estiver acelerando
                playerSpeed = Math.min(playerSpeed + 0.01, 1.0); // Aumenta a velocidade do carro do jogador
            } else if (braking) { // Se o carro do jogador estiver freando
                playerSpeed = Math.max(playerSpeed - 0.02, 0.2); // Diminui a velocidade do carro do jogador
            } else { // Se o carro do jogador não estiver acelerando nem freando
                playerSpeed = Math.max(playerSpeed - 0.01, 0.2); // Diminui a velocidade do carro do jogador lentamente
            }

            car.position.z -= playerSpeed * deltaTime * 60; // Move o carro do jogador para frente

            // Rotação do carro
            if (girando) { // Se o carro do jogador estiver girando
                car.rotation.y += 0.1; // Rotaciona o carro do jogador
            }

            // Atualizar som do motor baseado na velocidade
            engineSound.volume = 0.1 + playerSpeed * 0.2; // Atualiza o volume do som do motor
            engineSound.playbackRate = 0.8 + playerSpeed * 0.5; // Atualiza a taxa de reprodução do som do motor
        }

        // Gerenciar segmentos da pista
        if (segmentosPista.length < 10 && pistaModelo) { // Se houver menos de 10 segmentos da pista e o modelo da pista existir
            gerarSegmentoPista(); // Gera um novo segmento da pista
        }

        if (segmentosPista[0] && segmentosPista[0].position.z > camera.position.z + 100) { // Se o primeiro segmento da pista estiver muito longe da câmera
            reutilizarSegmentoPista(); // Reutiliza o primeiro segmento da pista
        }

        // Gerar carros de tráfego
        if (currentTime - lastCarSpawnTime > carSpawnInterval) { // Se o tempo decorrido desde a última geração de carro de tráfego for maior que o intervalo de geração
            createTrafficCar(); // Gera um novo carro de tráfego
            lastCarSpawnTime = currentTime; // Atualiza o tempo da última geração de carro de tráfego
            carSpawnInterval = 500 + (Math.random() - 0.5) * 200; // Gera um novo intervalo de geração de carro de tráfego
        }

        // Atualizar carros de tráfego
        for (let i = trafficCars.length - 1; i >= 0; i--) { // Para cada carro de tráfego
            const trafficCar = trafficCars[i]; // Obtém o carro de tráfego
            const carData = trafficCar.userData; // Obtém os dados do carro de tráfego

            trafficCar.position.z -= carData.speed; // Move o carro de tráfego para frente

            // Lógica de pontuação
            if (car && trafficCar.position.z < car.position.z && !carrosUltrapassados.includes(trafficCar)) { // Se o carro do jogador existir, o carro de tráfego estiver atrás do carro do jogador e o carro de tráfego não tiver sido ultrapassado
                pontuacao++; // Incrementa a pontuação
                atualizarPontuacao(); // Atualiza a pontuação exibida
                carrosUltrapassados.push(trafficCar); // Adiciona o carro de tráfego ao array de carros ultrapassados
            }

            // Remover carros que saíram da tela
            if (trafficCar.position.z < camera.position.z - SEGMENT_LENGTH * 2) { // Se o carro de tráfego estiver muito longe da câmera
                scene.remove(trafficCar); // Remove o carro de tráfego da cena
                trafficCars.splice(i, 1); // Remove o carro de tráfego do array de carros de tráfego
            }
        }

        // Verificar colisões
        checkCollisions(); // Verifica colisões

        // Atualizar câmera
        if (car) { // Se o carro do jogador existir
            camera.position.z = car.position.z + 7; // Atualiza a posição Z da câmera
            camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetCarPositionX, 0.1); // Move a câmera para a posição X alvo
            camera.position.y = 3; // Define a posição Y da câmera
        }

        // Atualizar velocímetro
        document.getElementById('velocimetro').textContent = `Velocidade: ${(playerSpeed * 100).toFixed(0)} km/h`; // Atualiza a velocidade exibida
    }

    renderer.render(scene, camera); // Renderiza a cena
}

// Iniciar o menu
menu.style.display = 'flex'; // Exibe o menu principal