

var createApp = function(canvas, timer, scoreBoard, leaderBoardModal) {
    canvas.style.display = "block";
    canvas.onclick = function(event) { checkClick(event, resetBoardInterval) };

    // Initialize properties
    var c = canvas.getContext("2d");
    var score = 0;
    var clicks = 0;
    var colors = [
        ["Red", "#ff0000"],
        ["Orange", "#ff9000"],
        ["Yellow", "#f6ff00"],
        ["Green", "#00ff08"],
        ["Cyan", "#00fff2"],
        ["Blue", "#0000ff"],
        ["Purple", "#a500ff"],
        ["Black", "#000000"],
        ["Brown", "#663333"],
        ["Grey", "#757470"]
    ];
    var wordsDisplayed = [];
    const canvasRect = canvas.getClientRects()[0];
    const fontSize = 20;
    var timeRemaining = 45;
    var resetBoardInterval;

    function startGame() {
        c.font = fontSize + "px Arial";
        timer.innerHTML = printTime();

        var timerInterval = setInterval(function() {
            if (timeRemaining > 0) {
                timeRemaining -= 1;
                timer.innerHTML = printTime()
            } else {
                clearInterval(timerInterval);
                endGame()
            }
        }, 1000);
        makeRound()
    }


    function endGame() {
        var scores = JSON.parse(localStorage.getItem("scores"));
        if (!scores) {
            scores = []
        }
        if (clicks > 0) {
            scores.push([score, score/clicks]);
        } else {
            scores.push([score, ""])
        }

        clearInterval();
        localStorage.setItem("scores", JSON.stringify(scores));
        showLeaderboard(leaderBoardModal, scores);
    }

    function makeRound() {
        addWords();
        resetBoardInterval = setInterval(function () {
            resetBoard(resetBoardInterval);
            if (timeRemaining > 0) {
                makeRound();
            }
        }, 1000 * (timeRemaining / 10 + 1));
    }


    function addWords() {
        // sets the board with more words as remaining time decreases
        var difficulty = Math.floor(10 - 7 * timeRemaining / 45);
        for (var i = 0; i < difficulty; i++) {
            if (i === 0) {
                // add the one word who's color matches its text
                addWord(true)
            } else {
                // add remaining words
                addWord()
            }
        }
    }

    function resetBoard(interval) {
        // clear the canvas, the array of words displayed, and the reset board interval
        c.clearRect(0, 0, canvas.width, canvas.height);
        wordsDisplayed = [];
        clearInterval(interval);
    }


    function addWord(match=false) {
        // draw from available words and randomly put the word somewhere that it won't overlap
        // with an existing word. If 'match' the text's color will match the word it spells
        var text, color;
        var word = { match: match };
        [text, color] = colors[randRange(colors.length)];

        // keep picking new text until we get one that is not yet displayed
        while (wordsDisplayed.some(function(word) { return word.text === text })) {
            [text, color] = colors[randRange(colors.length)];
        }
        word.text = text;

        // If we want text's color to not match the word it spells, keep sampling until we get something
        // different from the text that will be displayed and different from any color that is
        // currently displayed
        if (!match) {
            i = randRange(colors.length);

            while (wordsDisplayed.some(function(word) { return word.color === colors[i][1] }) || colors[i][0] === text) {
                i = randRange(colors.length)
            }
            color = colors[i][1];
        }
        word.color = color;

        // add the word to the canvas, and to the array of displayed words (including where the word is displayed)
        c.fillStyle = color;
        $.extend(true, word, pickSpot(text));
        c.fillText(text, word.x, word.y + word.height);
        wordsDisplayed.push(word)
    }

    function pickSpot(word) {
        // finds a randomly chosen spot that will fit the given text
        var width = c.measureText(word).width;
        var height = fontSize;

        var tentativeRect = {
            width: width,
            height: height,
            x: Math.random() * (canvas.width - width),
            y: Math.random() * (canvas.height - height)
        };

        var notValidRect = true;

        while (notValidRect) {
            if (wordsDisplayed.some(function(rect) { return doesOverlap(tentativeRect, rect) })) {
                // at least one existing rectangle overlaps with the tentative rectangle
                // reset the tentative rectangle's position and try again
                tentativeRect.x = Math.random() * (canvas.width - width);
                tentativeRect.y = Math.random() * (canvas.height - height);
            } else {
                notValidRect = false
            }
        }

        return tentativeRect
    }


    function checkClick(event, interval) {
        // checks if the user clicked the right word
        clicks += 1;
        var clickX = event.pageX - (canvasRect.left + 5);
        var clickY = event.pageY - (canvasRect.top + 5);

        for (var i = 0; i < wordsDisplayed.length; i++) {
            var word = wordsDisplayed[i];

            if (clickX <= word.x + word.width && clickX >= word.x &&
                clickY <= word.y + word.height && clickY >= word.y && word.match) {

                resetBoard(interval);
                score += 1;
                scoreBoard.innerText = score;
                makeRound();
            }
        }
    }


    // helper functions

    function doesOverlap(rect1, rect2) {
        // checks if two rectangles, given by (x,y) for upper-left corner and height and width, overlap
        return  rect1.x <= rect2.x + rect2.width    &&
                rect2.x <= rect1.x + rect1.width    &&
                rect1.y <= rect2.y + rect2.height   &&
                rect2.y <= rect1.y + rect1.height
    }


    function randRange(n) {
        // returns a random integer in {0, 1, ..., n-1}
        return Math.floor(Math.random() * n)
    }


    function printTime() {
        var mins = Math.floor(timeRemaining / 60);
        var secs = timeRemaining % 60;
        if (String(secs).length < 2) {
            secs = "0" + secs
        }

        return mins + ":" + secs
    }

    return {
        run: startGame
    }
};


// presents the bootstrap modal with past scores
function showLeaderboard(modal, scores) {
    if (scores.length === 0) {
        modal.innerText = "No saved scores yet!";
        $("#leaderModal").modal();
        return
    }
    modal.innerHTML = "";

    // sort by descending score
    scores.sort(function(a, b) {
        return b[0] - a[0]
    });

    // pick top 5 scores to display
    scores = scores.slice(0, 5);

    // set table header
    var header = document.createElement("tr");
    ["Position", "Score", "Accuracy"].forEach(function(elt) {
       var head = document.createElement("th");
       head.style.paddingLeft = "5px";
       head.style.paddingRight = "5px";
       head.innerText = elt;
       header.appendChild(head);
    });
    modal.appendChild(header);

    // populate table with scores
    // (this code is a bit redundant, but each data entry has its own format, so I just hard coded each)
    for (var i = 0; i < scores.length; i++) {
        var row = document.createElement("tr");

        var position = document.createElement("td");
        position.innerText = i + 1;
        row.appendChild(position);

        var score = document.createElement("td");
        score.innerText = scores[i][0];
        row.appendChild(score);

        var accuracy = document.createElement("td");
        if (scores[i][1]) {
            accuracy.innerText = 100 * Number(scores[i][1].toFixed(2)) + "%";
        } else {
            accuracy.innerText = "-";
        }
        row.appendChild(accuracy);

        modal.appendChild(row)
    }

    $("#leaderModal").modal();
}

window.onload = function() {
    // cache DOM queries
    var playButton, scoreButton;
    [playButton, scoreButton] = document.querySelectorAll(".gameButton");
    var gameDiv = document.querySelector("#gameDiv");
    var canvas = document.querySelector("#gameCanvas");
    var timer = document.querySelector("#timer");
    var scoreBoard = document.querySelector("#score");
    var leaderBoardData = document.querySelector("#leaderBoard");

    playButton.onclick = function() {
        playButton.style.display = "none";
        scoreButton.style.display = "none";
        timer.style.display = "block";
        scoreBoard.style.display = "block";
        gameDiv.style.top = "75px";
        canvas.setAttribute("height", gameDiv.clientHeight);
        canvas.setAttribute("width", gameDiv.clientWidth);

        app = createApp(canvas, timer, scoreBoard, leaderBoardData);
        app.run()
    };

    scoreButton.onclick = function() {
        var scores = JSON.parse(localStorage.getItem("scores"));
        if (scores) {
            showLeaderboard(leaderBoardData, scores)
        } else {
            showLeaderboard(leaderBoardData, [])
        }
    };

    document.querySelector("#closeModal").onclick = function() {
        canvas.style.display = "none";
        timer.style.display = "none";
        scoreBoard.innerText = "0";
        scoreBoard.style.display = "block";
        gameDiv.style.top = "0px";
        playButton.style.display = "inline";
        scoreButton.style.display = "inline";
    }

};

