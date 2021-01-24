document.addEventListener('DOMContentLoaded', function () {
  let width = 30,
    height = 30,
    commentNode = document.createComment('')
  document.insertBefore(commentNode, document.firstChild)

  const events = eventHandler()
  const can = drawer(width, height, commentNode)

  let state = resetState(width, height)
  setInterval(() => {
    state = gameLoop(can, events, state, width, height)
  }, 150)
})

const gameLoop = (drawer, events, state, width, height) => {
  let {
    snake,
    candy,
    score,
    time,
    loss,
    menu,
    menuSelection,
    menuState,
    lossBG,
    poop,
  } = state

  if (!loss) time.current = performance.now()

  if (menu) {
    menuSelection = changeMenuSelection(menuSelection, events)
    if (events.input() === 'Enter') {
      if (menuState === 0) {
        if (menuSelection === 0) {
          menu = false
          time.started = performance.now()
        } else if (menuSelection === 1) {
          menuState = 1
          menuSelection = 0
          events.clear()
        }
      } else if (menuState === 1) {
        menuState = 0
      }
    }
  } else {
    if (events.input() === 'ArrowUp') {
      snake.direction = 'up'
    } else if (events.input() === 'ArrowDown') {
      snake.direction = 'down'
    } else if (events.input() === 'ArrowLeft') {
      snake.direction = 'left'
    } else if (events.input() === 'ArrowRight') {
      snake.direction = 'right'
    }

    const nextHead = nextSnakeHead(snake)

    if (loss) {
      
    } else if (nextHead.x === candy.x && nextHead.y === candy.y) {
      snake.bits[0].e = state.candy.e
      snake.bits.splice(0, 0, nextHead)
      score++
      candy = getNewCandyLocation(width, height)
      while (candy.x === poop.x && candy.y === poop.y) {
        candy = getNewCandyLocation(width, height)
      }
    } else if (
      poop.active &&
      nextHead.x === poop.x &&
      nextHead.y === poop.y
    ) {
      if (snake.bits.length > 2) {
        let last = snake.bits.pop()
        last.x = snake.bits[1].x
        last.y = snake.bits[1].y
        snake.bits.splice(1, snake.bits.length - 1)
        snake.bits.push(last)
      }
      poop.active = false
      score = Math.floor(score / 3)
    } else if (
      nextHead.x < 0 ||
      nextHead.y < 0 ||
      nextHead.x > width - 1 ||
      nextHead.y > height - 1
    ) {
      loss = true
    } else if (
      snake.bits.some((e) => e.x === nextHead.x && e.y === nextHead.y)
    ) {
      loss = true
      time.loss = performance.now()
    } else {
      if (Math.random() < 0.1 && !poop.active && score > 5) {
        poop.active = true
        poop.x = snake.bits[snake.bits.length - 1].x
        poop.y = snake.bits[snake.bits.length - 1].y
      }
      snake = moveSnake(snake)
    }
  }

  let newState = {
    candy,
    score,
    snake,
    time,
    loss,
    menu,
    menuSelection,
    menuState,
    lossBG,
    poop,
  }

  if (loss) {
    if (events.input() === 'Enter') {
      newState = resetState(width, height)
    }
  }

  if (menu) {
    drawer.drawMenu(newState)
  } else {
    drawer.draw(newState)
  }
  events.clear()
  return newState
}

const eventHandler = () => {
  let input = ''

  window.onkeydown = function (e) {
    input = e.key
  }

  return {
    input: () => input,
    clear: () => {
      input = ''
    },
  }
}

const drawer = (width, height, node) => {
  return {
    drawMenu: (state) => {
      let drawing = '\n'
      if (state.menuState === 0) {
        drawing += `Snek Snek Snek\n`
        if (state.menuSelection === 0) drawing += '👉'
        else drawing += '⬛'
        drawing += ' Play\n'
        if (state.menuSelection === 1) drawing += '👉'
        else drawing += '⬛'
        drawing += ' About Me\n'
      } else if (state.menuState === 1) {
        drawing += `👨‍👩‍👧‍👦\n`
        drawing += `Made with 💙 by Jacob Strong\n`
        drawing += 'Check me out at https://github.com/jacstrong\n'
        drawing += 'Feel free to share this, credit would be awesome!\n'
        drawing += '👉 Back\n'
      }
      node.textContent = drawing
    },
    draw: (state) => {
      let board = []

      for (let i = 0; i < height; i++) {
        board.push([])
        for (let j = 0; j < width; j++) {
          let next = ''
          if (state.candy.x === j && state.candy.y === i) {
            next = state.candy.e
          } else {
            if (state.loss) {
              next = state.lossBG[i][j]
            } else {
              next = '⬛'
            }
          }
          board[i].push(next)
        }
      }

      if (state.poop.active) {
        board[state.poop.y][state.poop.x] = '💩'
      }

      for (let i = 0; i < state.snake.bits.length; i++) {
        const bit = state.snake.bits[i]
        board[bit.y][bit.x] = bit.e
      }

      let drawing = '\n'

      for (let i = 0; i < board.length; i++) {
        drawing += board[i].join('')
        drawing += '\n'
      }

      drawing += `Score: ${numberFormatter(state.score)}`
      drawing += '\n'
      drawing += `Time: ${numberFormatter(
        ((state.time.current - state.time.started) / 1000).toFixed(0)
      )}`
      if (state.loss) {
        drawing += '\nPress enter to return to menu.\n'
      }
      drawing += '\n'
      node.textContent = drawing
    },
  }
}

const changeMenuSelection = (menuSelection, events) => {
  if (events.input() === 'ArrowUp') {
    menuSelection -= 1
    if (menuSelection < 0) menuSelection = 0 
    return menuSelection
  } else if (events.input() === 'ArrowDown') {
    menuSelection += 1
    if (menuSelection > 1) menuSelection = 1
    return menuSelection
  } else {
    return menuSelection
  }
}

const initTheSnake = (width, height) => {
  const direction = Math.floor(Math.random() * 4)
  let snake = {
    bits: [],
    direction: 'up',
  }
  snake.bits.push({
    x: 8,
    y: 20,
    e: '🐱‍🐉',
  })
  snake.bits.push({
    x: 8,
    y: 20,
    e: '🟦',
  })
  return snake
}

const getNewCandyLocation = (width, height) => {
  return {
    x: Math.floor(Math.random() * width),
    y: Math.floor(Math.random() * height),
    e: randomFood(),
  }
}

const moveSnake = (snake) => {
  let newSnake = snake

  for (let i = newSnake.bits.length - 1; i > 0; i--) {
    newSnake.bits[i].x = newSnake.bits[i - 1].x
    newSnake.bits[i].y = newSnake.bits[i - 1].y
  }

  if (newSnake.direction === 'up') {
    newSnake.bits[0].y -= 1
  } else if (newSnake.direction === 'down') {
    newSnake.bits[0].y += 1
  } else if (newSnake.direction === 'left') {
    newSnake.bits[0].x -= 1
  } else if (newSnake.direction === 'right') {
    newSnake.bits[0].x += 1
  }

  return newSnake
}

const nextSnakeHead = (snake) => {
  let nextHead = {
    x: snake.bits[0].x,
    y: snake.bits[0].y,
    e: snake.bits[0].e,
  }
  if (snake.direction === 'up') {
    nextHead.y -= 1
  } else if (snake.direction === 'down') {
    nextHead.y += 1
  } else if (snake.direction === 'left') {
    nextHead.x -= 1
  } else if (snake.direction === 'right') {
    nextHead.x += 1
  }

  return nextHead
}

const numberFormatter = (n) => {
  if (n === 100) {
    return '💯'
  }
  return String(n)
    .split('')
    .map((e) => numberEmojiMap(e))
    .join('')
}

const numberEmojiMap = (n) => {
  switch (n) {
    case '0':
      return '0️⃣'
    case '1':
      return '1️⃣'
    case '2':
      return '2️⃣'
    case '3':
      return '3️⃣'
    case '4':
      return '4️⃣'
    case '5':
      return '5️⃣'
    case '6':
      return '6️⃣'
    case '7':
      return '7️⃣'
    case '8':
      return '8️⃣'
    case '9':
      return '9️⃣'
  }
}

const resetState = (width, height) => ({
  snake: initTheSnake(),
  candy: getNewCandyLocation(width, height),
  score: 0,
  time: {
    started: performance.now(),
    current: performance.now(),
    loss: 0
  },
  loss: false,
  lossBG: Array(height).fill(Array(width).fill('😭')),
  menu: true,
  menuSelection: 0,
  menuState: 0,
  poop: {
    active: false,
    x: 0,
    y: 0,
  },
})

const randomFood = () => {
  const food = [
    '🍜',
    '🍔',
    '🍠',
    '🌽',
    '🥨',
    '🌭',
    '🥓',
    '🍳',
    '🧇',
    '🍞',
    '🥯',
    '🥖',
    '🧀',
    '🥗',
    '🥙',
    '🥪',
    '🌮',
    '🌯',
    '🍖',
    '🍗',
    '🥩',
    '🥟',
    '🥠',
    '🥡',
    '🍱',
    '🍚',
    '🍛',
    '🦪',
    '🍣',
    '🍤',
    '🥮',
    '🍢',
    '🧆',
    '🥘',
    '🍲',
    '🍝',
    '🥣',
    '🥧',
    '🍩',
    '🎂',
    '🍰',
    '🍬',
    '🍭',
    '🍡',
    '🍮',
    '☕',
    '🍵',
    '🍾',
    '🍻',
    '🧊',
    '🥝',
    '🥥',
    '🍇',
    '🍈',
    '🍉',
    '🍌',
    '🍍',
    '🥭',
    '🍐',
    '🍑',
    '🍒',
    '🍓',
    '🍅',
    '🍆',
    '🍄',
    '🥑',
    '🥒',
    '🥬',
    '🥦',
    '🥔',
    '🌰',
  ]
  const rand = food[Math.floor(Math.random() * food.length)]
  return rand
}
