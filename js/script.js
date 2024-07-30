
/* Global events */
var windowInfo = {
    innerWidth : window.innerWidth,
    innerHeight : window.innerHeight,
    mouseInside : true,
    mouseX: 0,
    mouseY: 0
};
document.addEventListener('mousemove', function(event) {
    windowInfo.mouseX = event.clientX;
    windowInfo.mouseY = event.clientY;
});
document.addEventListener('mouseenter', function() {
    console.log('mouseenter');
    windowInfo.mouseInside = true;
});
document.addEventListener('mouseleave', function() {
    console.log('mouseleave');
    windowInfo.mouseInside = false;
});
window.addEventListener('resize', function() {
    windowInfo.innerWidth = window.innerWidth;
    windowInfo.innerHeight = window.innerHeight;
});



/* Background animation ans events */
function drawBackground() {
    var UPDATE_SPEED_WITH_MOUSE = true;

    var canvas = document.getElementById('backgroundCanvas');
    var ctx = canvas.getContext('2d');

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var width = canvas.width;
    var height = canvas.height;
    var gridSize = 50; // Taille de la grille
    var viaRadius = 5; // Rayon du via
    var lines = new Set(); // Stocke les lignes pour éviter les croisements

    var speedx = 0.5; // Vitesse de déplacement de la grille en x
    var speedy = 0.5; // Vitesse de déplacement de la grille en y
    var targetSpeedx = 0;
    var targetSpeedy = 0;
    var maxSpeed = 1; // Vitesse maximale
    var acceleration = 0.02; // Accélération pour atteindre la vitesse cible

    function drawVia(x, y) {
        ctx.beginPath();
        ctx.arc(x, y, viaRadius, 0, 2 * Math.PI);
        ctx.strokeStyle = "#b87333"; // couleur cuivrée tamisée
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function drawLine(x1, y1, x2, y2) {
        ctx.beginPath();
        sensX = Math.sign(x2 - x1);
        sensY = Math.sign(y2 - y1);
        ctx.moveTo(x1 + sensX*4, y1 + sensY*4);
        ctx.lineTo(x2 - sensX*4, y2 - sensY*4);
        ctx.strokeStyle = "#b87333"; // couleur cuivrée tamisée
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function isLineValid(x1, y1, x2, y2) {
        // Utiliser une chaîne unique pour chaque ligne pour éviter les doublons
        var line1 = `${x1},${y1},${x2},${y2}`;
        var line2 = `${x2},${y2},${x1},${y1}`; // Considérer les deux directions
        return !lines.has(line1) && !lines.has(line2);
    }

    function drawRandomLine() {
        var x1, y1, x2, y2;
        var attempts = 0;
        do {
            x1 = Math.floor(Math.random() * (width / gridSize)) * gridSize;
            y1 = Math.floor(Math.random() * (height / gridSize)) * gridSize;
            if (Math.random() > 0.5) {
                // Ligne horizontale
                x2 = x1 + gridSize;
                y2 = y1;
            } else {
                // Ligne verticale
                x2 = x1;
                y2 = y1 + gridSize;
            }
            attempts++;
            if (attempts > 100) return; // Éviter une boucle infinie
        } while (!isLineValid(x1, y1, x2, y2));

        drawVia(x1, y1);
        drawLine(x1, y1, x2, y2);
        drawVia(x2, y2);

        // Ajouter la ligne au set
        lines.add(`${x1},${y1},${x2},${y2}`);
    }

    function updateSpeed() {
        if (!UPDATE_SPEED_WITH_MOUSE) {
            // Changer la direction et la vitesse cible aléatoirement
            targetSpeedx = (Math.random() - 0.5) * maxSpeed * 2;
            targetSpeedy = (Math.random() - 0.5) * maxSpeed * 2;

            setTimeout(updateSpeed, 5000); // Changer de direction toutes les 5 secondes
        } else {
            var mouseX = event.clientX;
            var mouseY = event.clientY;

            if (windowInfo.mouseInside === false) {
                // L'utilisateur a déplacé la souris hors de la fenêtre
                targetSpeedx = 0;
                targetSpeedy = 0;
                return;
            }

            // Calculer la distance par rapport au centre du canvas
            var centerX = width / 2;
            var centerY = height / 2;
            var distance = Math.sqrt((mouseX - centerX) * (mouseX - centerX) + (mouseY - centerY) * (mouseY - centerY));

            // Calculer la vitesse en fonction de la distance
            var normalizedDistance = Math.min(distance / (Math.sqrt(centerX * centerX + centerY * centerY)), 1); // Normaliser la distance entre 0 et 1
            var currentMaxSpeed = maxSpeed * normalizedDistance; // Vitesse maximale réduite en fonction de la distance

            // Mettre à jour la vitesse cible
            var deltaX = mouseX - centerX;
            var deltaY = mouseY - centerY;
            var magnitude = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

            targetSpeedx = (deltaX / magnitude) * currentMaxSpeed;
            targetSpeedy = (deltaY / magnitude) * currentMaxSpeed;

            window.addEventListener('mousemove', updateSpeed);
        }
    }

    function updateGrid() {
        ctx.clearRect(0, 0, width, height);

        var updatedLines = new Set();

        var maxWidth = width + gridSize * 2;
        var maxHeight = height + gridSize * 2;

        // Mise à jour de la vitesse actuelle pour qu'elle converge vers la vitesse cible
        if (speedx < targetSpeedx) {
            speedx += acceleration;
            if (speedx > targetSpeedx) speedx = targetSpeedx;
        } else if (speedx > targetSpeedx) {
            speedx -= acceleration;
            if (speedx < targetSpeedx) speedx = targetSpeedx;
        }
        if (speedy < targetSpeedy) {
            speedy += acceleration;
            if (speedy > targetSpeedy) speedy = targetSpeedy;
        } else if (speedy > targetSpeedy) {
            speedy -= acceleration;
            if (speedy < targetSpeedy) speedy = targetSpeedy;
        }

        lines.forEach(line => {
            var [x1, y1, x2, y2] = line.split(',').map(Number);

            x1 += speedx;
            y1 += speedy;
            x2 += speedx;
            y2 += speedy;

            drawVia(x1, y1);
            drawLine(x1, y1, x2, y2);
            drawVia(x2, y2);

            // Réafficher les lignes qui dépassent sur l'autre côté
            if (x1 > width + gridSize || x2 > width + gridSize) {
                x1 -= maxWidth; x2 -= maxWidth;
            } else if (x1 < -gridSize || x2 < -gridSize) {
                x1 += maxWidth; x2 += maxWidth;
            }
            if (y1 > height + gridSize || y2 > height + gridSize) {
                y1 -= maxHeight; y2 -= maxHeight;
            } else if (y1 < -gridSize || y2 < -gridSize) {
                y1 += maxHeight; y2 += maxHeight;
            }

            drawVia(x1, y1);
            drawLine(x1, y1, x2, y2);
            drawVia(x2, y2);

            // Sauvegarder la position de la ligne
            updatedLines.add(`${x1},${y1},${x2},${y2}`);
        });

        lines = updatedLines;

        requestAnimationFrame(updateGrid);
    }

    function drawGrid() {
        lines.clear(); // Effacer toutes les lignes
        for (var i = 0; i < numberOfLines; i++) {
            drawRandomLine(); // Générer de nouvelles lignes aléatoires
        }
        updateGrid(); // Mettre à jour le fond avec les nouvelles lignes

        setInterval(drawGrid, 5 * 60 * 1000); // Redessiner toutes les lignes toutes les 5 minutes
    }

    var numberOfLines = 100 + Math.random() * 200;  // nombre aléatoire de lignes entre 100 et 300

    for (var i = 0; i < numberOfLines; i++) {
        drawRandomLine();
    }
    
    updateSpeed();
    drawGrid();
}

window.addEventListener('resize', drawBackground);
window.addEventListener('load', drawBackground);





function toggleNav() {
    var navbar = document.getElementById("myNavbar");
    var hamburger = document.getElementById("hamburger");
    var content = document.querySelector('.content');
    var sections = document.querySelectorAll('.section');
    var sections_footer = document.querySelectorAll('.section-footer');
    
    if (navbar.style.left === "0px") {
        navbar.style.left = "-250px";
        content.style.marginLeft = "0px";
        hamburger.style.left = "15px";
        hamburger.classList.remove("change");
        // Modification de la marge haute des sections (sauf la première)
        for (var i = 0; i < sections.length; i++) {
            sections[i].style.marginTop = "45px";
        }
        for (var i = 0; i < sections_footer.length; i++) {
            console.log(sections_footer[i].innerHTML);
            sections_footer[i].style.paddingLeft = "10px";
            sections_footer[i].style.width = document.body.clientWidth - 20 + "px";
        }
    } else {
        navbar.style.left = "0px";
        content.style.marginLeft = "250px";
        hamburger.style.left = "200px";
        hamburger.classList.add("change");
        // Modification de la marge haute des sections (sauf la première)
        for (var i = 0; i < sections.length; i++) {
            sections[i].style.marginTop = "0px";
        }
        for (var i = 0; i < sections_footer.length; i++) {
            sections_footer[i].style.paddingLeft = "260px";
            sections_footer[i].style.width = document.body.clientWidth - 270 + "px";
        }
    }
}

function showSection(sectionId) {
    var sections = document.querySelectorAll('.section');
    sections.forEach(function(section) {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

document.addEventListener("DOMContentLoaded", function() {
    var sections = document.querySelectorAll('.section');
    var sections_footer = document.querySelectorAll('.section-footer');

    for (var i = 0; i < sections.length; i++) {
        sections[i].style.marginTop = "45px";
    }
    for (var i = 0; i < sections_footer.length; i++) {
        //console.log(sections_footer[i].innerHTML);
        sections_footer[i].style.paddingLeft = "10px";
        sections_footer[i].style.width = document.body.clientWidth - 20 + "px";
    }
})






document.addEventListener("DOMContentLoaded", function() {
    // Créer l'élément tooltip
    var tooltip = document.createElement('div');
    tooltip.classList.add('tooltip');
    document.body.appendChild(tooltip);

    // Ajouter les événements de survol et de déplacement de la souris pour chaque lien
    var links = document.querySelectorAll('a');
    links.forEach(function(link) {
        link.addEventListener('mouseenter', function(event) {
            var imgSrc;
            switch (link.id) {
                case 'a-polytech':
                    imgSrc = 'img/polytech-grenoble.jpg';
                    break;
                case 'a-IUT1':
                    imgSrc = 'img/IUT1-grenoble.jpeg';
                    break;
                case 'a-lycee':
                    imgSrc = 'img/lycee-les-eaux-claires-grenoble.jpg';
                    break;
                case 'a-TIMA':
                    imgSrc = 'img/TIMA-grenoble.jpeg';
                    break;
                case 'a-Itancia':
                    imgSrc = 'img/itancia-grenoble.png';
                    break;
                default:
                    return;
            }
            tooltip.innerHTML = '<img src="' + imgSrc + '" alt="Image de l\'établissement">';
            tooltip.innerHTML += '<p style=\"font-size:12px;\">' + document.getElementById(link.id).getAttribute("href") + '</p>';
            tooltip.style.display = 'block';
        });

        link.addEventListener('mouseleave', function() {
            tooltip.style.display = 'none';
        });

        link.addEventListener('mousemove', function(event) {
            tooltip.style.left = event.pageX + 10 + 'px';
            tooltip.style.top = event.pageY + 10 + 'px';
        });
    });
});






function toggleProjectNav() {
    var navbar = document.getElementById("projectNavbar");
    
   
}

function showProjectSection(sectionId) {
    var sections = document.querySelectorAll('.section-main');
    sections.forEach(function(section) {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

document.addEventListener("DOMContentLoaded", function() {
})