import React from 'react'
import Board from './Board'
import { getBestActionByMCM } from './AI'

export default class BoardView extends React.Component {
	constructor(props) {
		super(props)
		this.state = { board: new Board() }
		this.isAIPlaying = false
		this.timer = null
	}
	componentDidUpdate() {
		if (this.isAIPlaying) {
			if (this.state.board.hasWon() || this.state.board.hasLost()) {
				this.isAIPlaying = false
			} else {
				this.timer = setTimeout(this.handleAIPlay, 200)
			}
		}
	}
	handleToggleAIPlay = () => {
		if (this.isAIPlaying) {
			this.isAIPlaying = false
			clearTimeout(this.timer)
		} else {
			this.isAIPlaying = true
			this.handleAIPlay()
		}
	}
	handleAIPlay = () => {
		console.time('ai')
		let action = getBestActionByMCM(this.state.board)
		console.timeEnd('ai')
		this.setState({
			board: this.state.board.move(action)
		})
	}
	restartGame() {
		this.setState({ board: new Board() })
	}
	handleKeyDown(event) {
		if (this.state.board.hasWon()) {
			return
		}
		if (event.keyCode >= 37 && event.keyCode <= 40) {
			event.preventDefault()
			var direction = event.keyCode - 37
			this.setState({
				board: this.state.board.move(direction)
			})
			console.log('hasChanged', this.state.board.hasChanged)
		}
	}
	handleTouchStart(event) {
		if (this.state.board.hasWon()) {
			return
		}
		if (event.touches.length != 1) {
			return
		}
		this.startX = event.touches[0].screenX
		this.startY = event.touches[0].screenY
		event.nativeEvent.preventDefault()
	}
	handleTouchEnd(event) {
		if (this.state.board.hasWon()) {
			return
		}
		if (event.changedTouches.length != 1) {
			return
		}
		var deltaX = event.changedTouches[0].screenX - this.startX
		var deltaY = event.changedTouches[0].screenY - this.startY
		var direction = -1
		if (Math.abs(deltaX) > 3 * Math.abs(deltaY) && Math.abs(deltaX) > 30) {
			direction = deltaX > 0 ? 2 : 0
		} else if (
			Math.abs(deltaY) > 3 * Math.abs(deltaX) &&
			Math.abs(deltaY) > 30
		) {
			direction = deltaY > 0 ? 3 : 1
		}
		if (direction != -1) {
			this.setState({ board: this.state.board.move(direction) })
		}
	}
	componentDidMount() {
		window.addEventListener('keydown', this.handleKeyDown.bind(this))
	}
	componentWillUnmount() {
		window.removeEventListener('keydown', this.handleKeyDown.bind(this))
		clearTimeout(this.timer)
	}
	render() {
		var cells = this.state.board.cells.map((row, rowIndex) => {
			return (
				<div key={rowIndex}>
					{row.map((_, columnIndex) => (
						<Cell key={rowIndex * Board.size + columnIndex} />
					))}
				</div>
			)
		})
		var tiles = this.state.board.tiles
			.filter(tile => tile.value != 0)
			.map(tile => <TileView tile={tile} key={tile.id} />)
		return (
			<div>
				<div>
					<h3>Description</h3>
					<ul>
						<li>Follow the Monte-Carlo method</li>
						<li>Simutalte next steps by 400 times</li>
						<li>count the result of each action</li>
						<li>pick the action of the highest score</li>
						<li>Repeat the steps above</li>
						<li>Click the button below to toggle AI</li>
					</ul>
				</div>
				<h3>Score: {this.state.board.score}</h3>
				<div
					className="board"
					onTouchStart={this.handleTouchStart.bind(this)}
					onTouchEnd={this.handleTouchEnd.bind(this)}
					tabIndex="1"
				>
					{cells}
					{tiles}
					<GameEndOverlay
						board={this.state.board}
						onRestart={this.restartGame.bind(this)}
					/>
				</div>
				<div>
					<button onClick={this.handleToggleAIPlay}>Toggle AI</button>
				</div>
			</div>
		)
	}
}

class Cell extends React.Component {
	shouldComponentUpdate() {
		return false
	}
	render() {
		return <span className="cell">{''}</span>
	}
}

class TileView extends React.Component {
	shouldComponentUpdate(nextProps) {
		if (this.props.tile != nextProps.tile) {
			return true
		}
		if (!nextProps.tile.hasMoved() && !nextProps.tile.isNew()) {
			return false
		}
		return true
	}
	render() {
		var tile = this.props.tile
		var classArray = ['tile']
		classArray.push('tile' + this.props.tile.value)
		if (!tile.mergedInto) {
			classArray.push('position_' + tile.row + '_' + tile.column)
		}
		if (tile.mergedInto) {
			classArray.push('merged')
		}
		if (tile.isNew()) {
			classArray.push('new')
		}
		if (tile.hasMoved()) {
			classArray.push('row_from_' + tile.fromRow() + '_to_' + tile.toRow())
			classArray.push(
				'column_from_' + tile.fromColumn() + '_to_' + tile.toColumn()
			)
			classArray.push('isMoving')
		}
		var classes = classArray.join(' ')
		return <span className={classes}>{tile.value}</span>
	}
}

var GameEndOverlay = ({ board, onRestart }) => {
	var contents = ''
	if (board.hasWon()) {
		contents = 'Good Job!'
	} else if (board.hasLost()) {
		contents = 'Game Over'
	}
	if (!contents) {
		return null
	}
	return (
		<div className="overlay">
			<p className="message">{contents}</p>
			<button className="tryAgain" onClick={onRestart} onTouchEnd={onRestart}>
				Try again
			</button>
		</div>
	)
}

function getValue({ value }) {
	return value / 2048
}

function getMax(a, b) {
	return a.value > b.value ? a : b
}

function toObj(value, index) {
	return { value, index }
}

function getIndex(obj) {
	return obj.index
}
