class SpiderSolitaire {
    constructor() {
        this.suits = ['♠', '♥', '♦', '♣'];
        this.suitColors = { '♠': 'black', '♥': 'red', '♦': 'red', '♣': 'black' };
        this.cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        this.columns = [];
        this.stock = [];
        this.moves = 0;
        this.startTime = null;
        this.timerInterval = null;
        this.history = [];
        this.draggingCards = [];
        this.dragStartPos = { x: 0, y: 0 };
        this.dragSourceColumn = -1;
        this.dragStartIndex = -1;
        
        this.initializeGame();
        this.setupEventListeners();
    }
    
    initializeGame() {
        this.resetGame();
        const difficulty = parseInt(document.getElementById('difficulty').value);
        this.createDeck(difficulty);
        this.shuffleDeck();
        this.dealInitialCards();
        this.renderGame();
        this.startTimer();
    }
    
    resetGame() {
        this.columns = [];
        this.stock = [];
        this.moves = 0;
        this.history = [];
        
        for (let i = 0; i < 10; i++) {
            this.columns.push([]);
        }
        
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        
        this.updateMoves();
        this.updateTimer();
    }
    
    createDeck(difficulty) {
        const usedSuits = this.suits.slice(0, difficulty);
        const decks = 8; // 蜘蛛纸牌使用8副牌
        
        this.stock = [];
        
        for (let d = 0; d < decks; d++) {
            for (const suit of usedSuits) {
                for (const value of this.cardValues) {
                    this.stock.push({
                        suit,
                        value,
                        color: this.suitColors[suit],
                        faceDown: true
                    });
                }
            }
        }
    }
    
    shuffleDeck() {
        for (let i = this.stock.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.stock[i], this.stock[j]] = [this.stock[j], this.stock[i]];
        }
    }
    
    dealInitialCards() {
        let cardIndex = 0;
        
        for (let i = 0; i < 10; i++) {
            const cardsToDeal = i < 4 ? 6 : 5;
            
            for (let j = 0; j < cardsToDeal; j++) {
                if (cardIndex < this.stock.length) {
                    const card = this.stock[cardIndex];
                    card.faceDown = j < cardsToDeal - 1;
                    this.columns[i].push(card);
                    cardIndex++;
                }
            }
        }
        
        this.stock = this.stock.slice(cardIndex);
    }
    
    renderGame() {
        const columnsContainer = document.getElementById('columns');
        columnsContainer.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const column = document.createElement('div');
            column.className = 'column';
            column.dataset.column = i;
            
            this.columns[i].forEach((card, index) => {
                const cardElement = this.createCardElement(card, index, i);
                column.appendChild(cardElement);
            });
            
            columnsContainer.appendChild(column);
        }
        
        this.renderStock();
    }
    
    createCardElement(card, index, columnIndex) {
        const cardElement = document.createElement('div');
        cardElement.className = 'card';
        cardElement.dataset.index = index;
        cardElement.dataset.column = columnIndex;
        
        if (card.faceDown) {
            cardElement.classList.add('face-down');
        } else {
            cardElement.classList.add(card.color);
            
            cardElement.innerHTML = `
                <div class="top-left">
                    <div>${this.getValueDisplay(card.value)}</div>
                    <div class="suit">${card.suit}</div>
                </div>
                <div class="bottom-right">
                    <div>${this.getValueDisplay(card.value)}</div>
                    <div class="suit">${card.suit}</div>
                </div>
            `;
        }
        
        cardElement.style.top = `${index * 20}px`;
        
        return cardElement;
    }
    
    getValueDisplay(value) {
        return value;
    }
    
    renderStock() {
        const stockContainer = document.getElementById('stock-pile');
        stockContainer.innerHTML = '';
        
        const stockCount = Math.ceil(this.stock.length / 10);
        
        for (let i = 0; i < stockCount && i < 5; i++) {
            const stockCard = document.createElement('div');
            stockCard.className = 'card back';
            stockCard.style.left = `${-i * 5}px`;
            stockContainer.appendChild(stockCard);
        }
    }
    
    startTimer() {
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.updateTimer();
        }, 1000);
    }
    
    updateTimer() {
        if (!this.startTime) {
            document.getElementById('timer').textContent = '时间: 00:00';
            return;
        }
        
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        
        document.getElementById('timer').textContent = 
            `时间: ${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    updateMoves() {
        document.getElementById('moves').textContent = `步数: ${this.moves}`;
    }
    
    canMoveCards(cards, targetColumn) {
        if (cards.length === 0) return false;
        
        const topCard = cards[0];
        
        if (this.columns[targetColumn].length === 0) {
            return true;
        }
        
        const bottomCard = this.columns[targetColumn][this.columns[targetColumn].length - 1];
        
        return this.getValueIndex(topCard.value) === this.getValueIndex(bottomCard.value) - 1;
    }
    
    getValueIndex(value) {
        return this.cardValues.indexOf(value);
    }
    
    canMoveFromIndex(columnIndex, startIndex) {
        const column = this.columns[columnIndex];
        
        for (let i = startIndex; i < column.length - 1; i++) {
            const current = column[i];
            const next = column[i + 1];
            
            if (current.faceDown || next.faceDown) return false;
            if (current.suit !== next.suit) return false;
            if (this.getValueIndex(current.value) !== this.getValueIndex(next.value) + 1) return false;
        }
        
        return !column[startIndex].faceDown;
    }
    
    moveCards(sourceColumn, startIndex, targetColumn) {
        const cardsToMove = this.columns[sourceColumn].splice(startIndex);
        
        this.saveState();
        
        cardsToMove.forEach(card => {
            this.columns[targetColumn].push(card);
        });
        
        if (this.columns[sourceColumn].length > 0) {
            const lastCard = this.columns[sourceColumn][this.columns[sourceColumn].length - 1];
            if (lastCard.faceDown) {
                lastCard.faceDown = false;
            }
        }
        
        this.moves++;
        this.updateMoves();
        
        this.checkForCompleteSuit(targetColumn);
        
        this.renderGame();
    }
    
    checkForCompleteSuit(columnIndex) {
        const column = this.columns[columnIndex];
        if (column.length < 13) return;
        
        const startIndex = column.length - 13;
        const potentialSuit = column.slice(startIndex);
        
        const firstCard = potentialSuit[0];
        if (firstCard.value !== 'K') return;
        
        for (let i = 0; i < potentialSuit.length; i++) {
            const card = potentialSuit[i];
            if (card.suit !== firstCard.suit) return;
            if (card.faceDown) return;
            if (this.getValueIndex(card.value) !== 12 - i) return;
        }
        
        column.splice(startIndex);
        this.renderGame();
    }
    
    hasEmptyColumn() {
        for (let i = 0; i < 10; i++) {
            if (this.columns[i].length === 0) {
                return true;
            }
        }
        return false;
    }
    
    showAlert(message) {
        alert(message);
    }
    
    dealFromStock() {
        if (this.stock.length === 0) return;
        
        if (this.hasEmptyColumn()) {
            this.showAlert('有空列时不能发牌，请先填满所有空列！');
            return;
        }
        
        for (let i = 0; i < 10; i++) {
            if (this.stock.length > 0) {
                const card = this.stock.pop();
                card.faceDown = false;
                this.columns[i].push(card);
            }
        }
        
        this.saveState();
        this.moves++;
        this.updateMoves();
        
        for (let i = 0; i < 10; i++) {
            this.checkForCompleteSuit(i);
        }
        
        this.renderGame();
        this.applyDealAnimation();
    }
    
    applyDealAnimation() {
        for (let i = 0; i < 10; i++) {
            const columnElement = document.querySelector(`.column[data-column="${i}"]`);
            if (columnElement) {
                const cards = columnElement.querySelectorAll('.card');
                if (cards.length > 0) {
                    const lastCard = cards[cards.length - 1];
                    lastCard.classList.add('dealing');
                    
                    setTimeout(() => {
                        lastCard.classList.remove('dealing');
                    }, 300);
                }
            }
        }
    }
    
    saveState() {
        const state = {
            columns: JSON.parse(JSON.stringify(this.columns)),
            stock: JSON.parse(JSON.stringify(this.stock)),
            moves: this.moves
        };
        
        this.history.push(state);
        
        if (this.history.length > 10) {
            this.history.shift();
        }
    }
    
    undo() {
        if (this.history.length === 0) return;
        
        const previousState = this.history.pop();
        
        this.columns = previousState.columns;
        this.stock = previousState.stock;
        this.moves = previousState.moves;
        
        this.updateMoves();
        this.renderGame();
    }
    
    setupEventListeners() {
        document.getElementById('new-game').addEventListener('click', () => {
            this.initializeGame();
        });
        
        document.getElementById('difficulty').addEventListener('change', () => {
            this.initializeGame();
        });
        
        document.getElementById('undo').addEventListener('click', () => {
            this.undo();
        });
        
        document.getElementById('stock-pile').addEventListener('click', () => {
            this.dealFromStock();
        });
        
        this.setupDragDrop();
    }
    
    setupDragDrop() {
        const columnsContainer = document.getElementById('columns');
        
        columnsContainer.addEventListener('mousedown', (e) => {
            const cardElement = e.target.closest('.card');
            if (!cardElement) return;
            
            const columnIndex = parseInt(cardElement.dataset.column);
            const cardIndex = parseInt(cardElement.dataset.index);
            
            if (!this.canMoveFromIndex(columnIndex, cardIndex)) return;
            
            this.dragSourceColumn = columnIndex;
            this.dragStartIndex = cardIndex;
            this.draggingCards = this.columns[columnIndex].slice(cardIndex);
            
            this.dragStartPos = {
                x: e.clientX,
                y: e.clientY
            };
            
            this.createDragElements(columnIndex, cardIndex);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.draggingCards.length === 0) return;
            
            const dx = e.clientX - this.dragStartPos.x;
            const dy = e.clientY - this.dragStartPos.y;
            
            const dragContainer = document.getElementById('drag-container');
            const dragCards = dragContainer.querySelectorAll('.card');
            
            dragCards.forEach((card, index) => {
                const originalTop = parseInt(card.dataset.originalTop);
                card.style.left = `${dx}px`;
                card.style.top = `${originalTop + dy}px`;
            });
        });
        
        document.addEventListener('mouseup', (e) => {
            if (this.draggingCards.length === 0) return;
            
            const targetColumn = this.getTargetColumn(e.clientX, e.clientY);
            
            if (targetColumn !== -1 && targetColumn !== this.dragSourceColumn) {
                if (this.canMoveCards(this.draggingCards, targetColumn)) {
                    this.moveCards(this.dragSourceColumn, this.dragStartIndex, targetColumn);
                }
            }
            
            this.clearDragElements();
            this.draggingCards = [];
            this.dragSourceColumn = -1;
            this.dragStartIndex = -1;
        });
    }
    
    createDragElements(columnIndex, startIndex) {
        const dragContainer = document.getElementById('drag-container');
        dragContainer.innerHTML = '';
        
        const column = this.columns[columnIndex];
        const originalColumn = document.querySelector(`.column[data-column="${columnIndex}"]`);
        
        for (let i = startIndex; i < column.length; i++) {
            const card = column[i];
            const originalCard = originalColumn.querySelector(`.card[data-index="${i}"]`);
            
            const dragCard = originalCard.cloneNode(true);
            dragCard.classList.add('dragging');
            dragCard.dataset.originalTop = parseInt(originalCard.style.top) || i * 20;
            dragCard.style.position = 'absolute';
            dragCard.style.left = '0px';
            dragCard.style.top = `${parseInt(originalCard.style.top) || i * 20}px`;
            
            const rect = originalCard.getBoundingClientRect();
            dragCard.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
            
            dragContainer.appendChild(dragCard);
        }
    }
    
    clearDragElements() {
        const dragContainer = document.getElementById('drag-container');
        dragContainer.innerHTML = '';
    }
    
    getTargetColumn(x, y) {
        const columns = document.querySelectorAll('.column');
        
        for (let i = 0; i < columns.length; i++) {
            const rect = columns[i].getBoundingClientRect();
            
            if (x >= rect.left && x <= rect.right && y >= rect.top) {
                return i;
            }
        }
        
        return -1;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SpiderSolitaire();
});
