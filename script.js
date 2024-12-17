let rules, players = [], round = 1;
let totals = [];
let eliminatedPlayers = [];

window.onload = function () {
    players = JSON.parse(localStorage.getItem("players"));
    rules = JSON.parse(localStorage.getItem("gameRules"));
    setupGamePage();
};

function setupGamePage() {
    const selector = document.getElementById("playerSelector");
    players.forEach((player, index) => selector.innerHTML += `<option value="${index}">${player}</option>`);
    totals = new Array(players.length).fill(0);
    eliminatedPlayers = new Array(players.length).fill(false);
    generateTable();
}

function generateTable() {
    const table = document.getElementById("scoreTable");
    table.innerHTML = `<tr><th>Round</th>${players.map(p => `<th>${p}</th>`).join("")}</tr>`;
    addRoundRow();
    addTotalRow();
}

function addRoundRow() {
    const table = document.getElementById("scoreTable");
    const totalRow = document.getElementById("totalRow");

    let row = `<tr id="round-${round}"><td>${round}</td>`;
    players.forEach((_, index) => {
        row += `<td><input type="number" id="score-${round}-${index}" value="0" min="0" 
                oninput="validateScore(${round}, ${index})" ${eliminatedPlayers[index] ? 'disabled' : ''}></td>`;
    });
    row += "</tr>";

    totalRow ? totalRow.insertAdjacentHTML("beforebegin", row) : table.innerHTML += row;
}

function addTotalRow() {
    const table = document.getElementById("scoreTable");
    let totalRow = `<tr id="totalRow"><td><b>Total</b></td>`;
    players.forEach((_, index) => totalRow += `<td id="total-${index}">0</td>`);
    totalRow += "</tr>";
    table.innerHTML += totalRow;
}

function validateScore(round, playerIndex) {
    const input = document.getElementById(`score-${round}-${playerIndex}`);
    const score = Number(input.value);

    if (score > rules.fullCountPoints) {
        input.value = 0; // Temporarily reset the input
        showCenteredPopup(
            "Score Exceeded!",
            `Assign Full Count (${rules.fullCountPoints}) points?`,
            () => assignFullCountPoints(round, playerIndex) // Assign points on "Yes"
        );
    } else {
        updateTotals();
    }
}

function assignFullCountPoints(round, playerIndex) {
    const input = document.getElementById(`score-${round}-${playerIndex}`);
    if (input) {
        input.value = rules.fullCountPoints; // Assign full count points
        updateTotals(); // Update totals after assigning
    }
}

function applyPoints(type) {
    const playerIndex = document.getElementById("playerSelector").value;
    const input = document.getElementById(`score-${round}-${playerIndex}`);
    const points = (type === "drop") ? rules.dropPoints :
                   (type === "midDrop") ? rules.midDropPoints :
                   (type === "fullCount") ? rules.fullCountPoints : 0;

    if (!eliminatedPlayers[playerIndex]) {
        input.value = points;
        updateTotals();
    }
}

function updateTotals() {
    let remainingPlayers = 0;
    let winnerIndex = null;

    players.forEach((_, index) => {
        if (eliminatedPlayers[index]) return;

        let total = 0;
        for (let r = 1; r <= round; r++) {
            const scoreInput = document.getElementById(`score-${r}-${index}`);
            total += scoreInput ? Number(scoreInput.value) || 0 : 0;
        }

        totals[index] = total;
        document.getElementById(`total-${index}`).innerText = total;

        if (total > rules.totalPoints && !eliminatedPlayers[index]) {
            eliminatedPlayers[index] = true;
            disablePlayerColumn(index);
            showCenteredPopup(
                "Player Eliminated",
                `Player ${index + 1} has been eliminated as their total score is more than ${rules.totalPoints}.`
            );
        }

        if (!eliminatedPlayers[index]) {
            remainingPlayers++;
            winnerIndex = index;
        }
    });

    highlightScores();

    if (remainingPlayers === 1) {
        showWinnerPopup(winnerIndex);
    }
}

function disablePlayerColumn(playerIndex) {
    for (let r = 1; r <= round; r++) {
        const input = document.getElementById(`score-${r}-${playerIndex}`);
        if (input) input.disabled = true;
    }
    document.getElementById(`total-${playerIndex}`).style.backgroundColor = "grey";
}

function highlightScores() {
    const max = Math.max(...totals.filter((_, index) => !eliminatedPlayers[index]));
    const min = Math.min(...totals.filter((_, index) => !eliminatedPlayers[index]));

    players.forEach((_, index) => {
        const cell = document.getElementById(`total-${index}`);
        if (cell) {
            cell.classList.remove("green", "red");
            if (totals[index] === max && !eliminatedPlayers[index]) cell.classList.add("red");
            if (totals[index] === min && !eliminatedPlayers[index]) cell.classList.add("green");
        }
    });
}

function nextRound() {
    round++;
    document.getElementById("roundNumber").innerText = round;
    addRoundRow();
}

function showCenteredPopup(title, message, callback = null) {
    const popup = document.createElement("div");
    popup.id = "popup";
    popup.style.position = "fixed";
    popup.style.top = "0";
    popup.style.left = "0";
    popup.style.width = "100%";
    popup.style.height = "100%";
    popup.style.background = "rgba(0, 0, 0, 0.8)";
    popup.style.display = "flex";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = "1000";

    popup.innerHTML = `
        <div style="background: white; padding: 20px; border-radius: 10px; text-align: center;">
            <h2>${title}</h2>
            <p>${message}</p>
            ${callback ? `<button onclick="(${callback})(); closePopup()">Yes</button>` : ''}
            <button onclick="closePopup()">Close</button>
        </div>
    `;
    document.body.appendChild(popup);
}

function closePopup() {
    const popup = document.getElementById("popup");
    if (popup) popup.remove();
}

function showWinnerPopup(winnerIndex) {
    showCenteredPopup(
        "🎉 Congratulations 🎉",
        `Player ${winnerIndex + 1} won the game!`,
        () => window.location.reload()
    );
}
