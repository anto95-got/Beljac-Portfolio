
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.src = "https://i.ibb.co/Q9yv5Jk/flappy-bird-set.png";

    let gamePlaying = false;
    const gravity = 0.5;
    const speed = 6.2;
    const size = [51, 36];
    const jump = -11.5;
    const cTenth = canvas.width / 10;

    let index = 0,
        bestScore = 0,
        flight,
        flyHeight,
        currentScore,
        pipes;

    const pipeWidth = 78;
    const pipeGap = 270;
    const pipeLoc = () => Math.random() * ((canvas.height - (pipeGap + pipeWidth)) - pipeWidth) + pipeWidth;

    // Fonction pour rendre la div .content visible
    document.querySelector('.content').style.display = "block";

    const setup = () => {
        currentScore = 0;
        flight = jump;
        flyHeight = (canvas.height / 2) - (size[1] / 2);
        pipes = Array(3).fill().map((_, i) => [canvas.width + (i * (pipeGap + pipeWidth)), pipeLoc()]);
    };

    const render = () => {
        index++;

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -((index * (speed / 2)) % canvas.width) + canvas.width, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height, -(index * (speed / 2)) % canvas.width, 0, canvas.width, canvas.height);

        if (gamePlaying) {
            pipes.forEach(pipe => {
                pipe[0] -= speed;

                ctx.drawImage(img, 432, 588 - pipe[1], pipeWidth, pipe[1], pipe[0], 0, pipeWidth, pipe[1]);
                ctx.drawImage(img, 432 + pipeWidth, 108, pipeWidth, canvas.height - pipe[1] + pipeGap, pipe[0], pipe[1] + pipeGap, pipeWidth, canvas.height - pipe[1] + pipeGap);

                if (pipe[0] <= -pipeWidth) {
                    currentScore++;
                    bestScore = Math.max(bestScore, currentScore);
                    pipes = [...pipes.slice(1), [pipes[pipes.length - 1][0] + pipeGap + pipeWidth, pipeLoc()]];
                }

                if ([
                    pipe[0] <= cTenth + size[0],
                    pipe[0] + pipeWidth >= cTenth,
                    pipe[1] > flyHeight || pipe[1] + pipeGap < flyHeight + size[1]
                ].every(Boolean)) {
                    gamePlaying = false;
                    setup();
                }
            });
        }

        if (gamePlaying) {
            ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * size[1], ...size, cTenth, flyHeight, ...size);
            flight += gravity;
            flyHeight = Math.min(flyHeight + flight, canvas.height - size[1]);
        } else {
            ctx.drawImage(img, 432, Math.floor((index % 9) / 3) * size[1], ...size, (canvas.width / 2) - (size[0] / 2), flyHeight, ...size);
            flyHeight = (canvas.height / 2) - (size[1] / 2);
            ctx.fillText(`Best score : ${bestScore}`, 85, 245);
            ctx.fillText(`Click to play`, 90, 535);
            ctx.font = "bold 30px courier";
        }

        document.getElementById('bestScore').innerHTML = `Best : ${bestScore}`;
        document.getElementById('currentScore').innerHTML = `Current : ${currentScore}`;

        window.requestAnimationFrame(render);
    };

    setup();
    img.onload = render;

    // Seul le clic sur le canvas démarre le jeu
    canvas.addEventListener('click', () => {
        if (!gamePlaying) {
            gamePlaying = true;
        }
        flight = jump;
    });



    function start(){
        location.href = "#fla"; // Remplacez par l'URL de votre choix
    
    }
    
    
    
    const  card = document.querySelectorAll(".card");
    
    card.forEach(el => {
        el.addEventListener('mousemove', e => {
    
            let elRect = el.getBoundingClientRect()
    
            let x = e.clientX - elRect.x
            let y = e.clientY - elRect.y
    
            let midCardWidth = elRect.width / 2
            let midCardHeight = elRect.height / 2
    
            let angleY = (x - midCardWidth) / 1
            let angleX = (y - midCardHeight) / 1
    
            el.children[0].style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.1)`
        })
    
        el.addEventListener('mouseleave', () => {
            el.children[0].style.transform = "rotateX(0) rotateY(0)"
     
        })
    })
    
    