$(document).ready(function() {

  var myPlayerNumber = undefined;
  var enemyPlayerNumber = undefined;
  var name = prompt('Ingresa tu nombre');
  var letters = "abcdefgh".split('');
  var boardArray = [];
  var enemyArray = [];
  var myShips = [];
  var currentShipLength = 5;
  var tempLocation;
  var tempFirebase;
  var firebaseData;
  var enemyShips;
  var enemyName;
  var enemyFive, enemyFour, enemyThree, enemyTwo;
  var myHits = [];
  var myTurns = [];
  var buttonState = 0;
  
  function assignPlayer() {
    var gameRef = new Firebase('https://barquitos-42dff.firebaseio.com/datos');
    var gameTempArray = getSynchronizedArray(gameRef);
    setTimeout(function() {
      if (gameTempArray.length === 0) {
        var disconnectHandler = new Firebase('https://barquitos-42dff.firebaseio.com/datos/');
        disconnectHandler.onDisconnect().remove();
        var playerZeroRef = gameRef.child('0');
        gameTempArray = getSynchronizedArray(playerZeroRef);
        gameTempArray.$set('nombre', name);
        myPlayerNumber = 0;
        enemyPlayerNumber = 1;
      } else if (gameTempArray.length === 1) {
        var disconnectHandler = new Firebase('https://barquitos-42dff.firebaseio.com/datos/');
        disconnectHandler.onDisconnect().remove();
        var playerOneRef = gameRef.child('1');
        gameTempArray = getSynchronizedArray(playerOneRef);
        gameTempArray.$set('nombre', name);
        myPlayerNumber = 1;
        enemyPlayerNumber = 0;
      } else {
        alert('El juego está lleno');
      }
    }, 3000);
  }

  assignPlayer();

  var myDataRef = new Firebase('https://barquitos-42dff.firebaseio.com/chat/');
  var sendMessage = function() {
    var currentTime = new Date();
    var hour = ((currentTime.getHours() > 9) ? currentTime.getHours() : '0' + currentTime.getHours());
    var minute = ((currentTime.getMinutes() > 9) ? currentTime.getMinutes() : '0' + currentTime.getMinutes());
    var second = ((currentTime.getSeconds() > 9) ? currentTime.getSeconds() : '0' + currentTime.getSeconds());
    var time = (hour + ":" + minute + ":" + second);
    var text = $('#messageInput').val();
    myDataRef.push({
      time: time,
      name: name,
      text: text
    });
    $('#messageInput').val('');
  }

  $('#messageInput').keypress(function(e) {
    if (e.keyCode == 13) {
      sendMessage();
    }
  });

  $('#send').on('click', sendMessage);

  myDataRef.on('child_added', function(snapshot) {
    var message = snapshot.val();
    displayChatMessage(message.time, message.name, message.text);
  });

  function displayChatMessage(time, name, text) {
    $('<div/>').text(text).prepend($('<strong/>').text(time + ' - ' + name + ': ')).appendTo($('#messagesDiv'));
    $('#messagesDiv')[0].scrollTop = $('#messagesDiv')[0].scrollHeight;
  };

  var clearChat = function() {
    var quickRemove = new Firebase('https://barquitos-42dff.firebaseio.com/chat/');
    quickRemove.remove();
    $('#messagesDiv').html('');
  };

  var createBoard = function() {
    for (var i = 0; i < 5; i++) {
      var tempArray = [];
      for (var j = 1; j < 6; j++) {
        var $cell = $('<div></div>').attr('id', (letters[i] + j)).addClass('myBoardSquare').addClass('grow').appendTo('#boardDiv');
        $cell.text(($cell.attr('id').toUpperCase()));
        tempArray.push(letters[i] + j);
      }
      boardArray.push(tempArray);
    }
  }

  var createEnemyBoard = function() {
    for (var i = 0; i < 5; i++) {
      var tempArray = [];
      for (var j = 1; j < 6; j++) {
        var $cell = $('<div></div>').attr('id', 'e' + (letters[i] + j)).addClass('enemyBoardSquare').addClass('grow').appendTo('#boardDiv');
        $cell.text(($cell.attr('id').slice(1).toUpperCase()));
        tempArray.push(letters[i] + j);
      }
      enemyArray.push(tempArray);
    }
  }

  createEnemyBoard();
  createBoard();

  var placementPhase = function() {
    $("<div>Bienvenido <strong>" + name + "</strong>, Coloca las piezas en las casillas!</div>").appendTo('#statusLog')
    var tempHeight = $('#statusLog')[0].scrollHeight;
    $('#statusLog').scrollTop(tempHeight);
    $('.myBoardSquare').on('click', function() {
      var $boardID = $(this).attr('id').split('');
      var rowIndex = letters.indexOf($boardID[0]);
      var columnIndex = (parseInt($boardID[1]) - 1);
      var shipLength = currentShipLength;
      if (shipLength === 0) {
        return;
      }
      if ($("#checkboxActual").is(':checked')) {
        verticalPlace(shipLength, rowIndex, columnIndex);
      } else {
        horizontalPlace(shipLength, rowIndex, columnIndex);
      }
    });
  }

  placementPhase();
 
  var checkForCompleteSetup = function() {
    if (currentShipLength < 2) {
      $("<div><strong>Todas las piezas han sido colocadas</strong></div>").appendTo('#statusLog')
      var tempHeight = $('#statusLog')[0].scrollHeight;
      $('#statusLog').scrollTop(tempHeight);
      $('.myBoardSquare').off('click');
      pushShipsToFirebase();
      checkForStart();
      return;
    }
  }

  var pushShipsToFirebase = function() {
    setTimeout(function() {
      tempLocation = 'https://barquitos-42dff.firebaseio.com/datos/' + myPlayerNumber + '/';
      tempFirebase = new Firebase(tempLocation);
      var tempSyncArray = getSynchronizedArray(tempFirebase);
      tempSyncArray.$set('Barcos', myShips);
      tempSyncArray.$set('zListo', true);
    }, 5000);
  }

  var horizontalPlace = function(currentShip, rIndex, cIndex) {
    if (horizontalCollisionCheck(currentShip, rIndex, cIndex) &&
      legalHorizontalMove(currentShip, cIndex)) {
      var tempShip = [];
      for (var i = 0; i < currentShip; i++) {
        $('#' + boardArray[rIndex][cIndex + i]).text('O');
        $('#' + boardArray[rIndex][cIndex + i]).css('background-color', 'grey');
        tempShip.push(boardArray[rIndex][cIndex + i]);
      }
      myShips.push(tempShip);
      currentShipLength--;
      checkForCompleteSetup();
      return;
    } else {
      return;
    }
  }

  var verticalPlace = function(currentShip, rIndex, cIndex) {
    if (verticalCollisionCheck(currentShip, rIndex, cIndex) &&
      legalVerticalMove(currentShip, rIndex)) {
      var tempShip = [];
      for (var i = 0; i < currentShip; i++) {
        $('#' + boardArray[rIndex + i][cIndex]).text('O');
        $('#' + boardArray[rIndex + i][cIndex]).css('background-color', 'grey');
        tempShip.push(boardArray[rIndex + i][cIndex]);
      }
      myShips.push(tempShip);
      currentShipLength--;
      checkForCompleteSetup();
      return;
    } else {
      return;
    }
  }

  var horizontalCollisionCheck = function(shipLength, rIndex, sIndex) {
    for (var i = 0; i < shipLength; i++) {
      if ($('#' + (boardArray[rIndex][sIndex + i])).text() === 'O') {
        $('<div>Hay una pieza colocada en la casilla, intenta en otro lugar</div>').appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        return false;
      }
    }
    return true;
  }

  var verticalCollisionCheck = function(shipLength, rIndex, cIndex) {
    for (var i = 0; i < shipLength; i++) {
      if ($('#' + (boardArray[rIndex + i][cIndex])).text() === 'O') {
        $('<div>Hay una pieza colocada en la casilla, intenta en otro lugar</div>').appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        return false;
      }
    }
    return true;
  }

  var legalHorizontalMove = function(shipLength, cIndex) {
    if (cIndex + shipLength <= 8) {
      return true;
    } else {
      $("<div>La pieza no cabe.</div>").appendTo('#statusLog')
      var tempHeight = $('#statusLog')[0].scrollHeight;
      $('#statusLog').scrollTop(tempHeight);
      return false;
    }
  }

  var legalVerticalMove = function(shipLength, rIndex) {
    if (rIndex + shipLength <= 8) {
      return true;
    } else {
      $("<div>La pieza no cabe.</div>").appendTo('#statusLog')
      var tempHeight = $('#statusLog')[0].scrollHeight;
      $('#statusLog').scrollTop(tempHeight);
      return false;
    }
  }

  var checkForStart = function() {
    var startTimer = setInterval(function() {
      tempLocation = 'https://barquitos-42dff.firebaseio.com/datos/' + enemyPlayerNumber + '/';
      tempFirebase = new Firebase(tempLocation);
      var tempSyncArray = getSynchronizedArray(tempFirebase);
      if (tempSyncArray[2] === true) {
        clearInterval(startTimer);
        enemyShips = tempSyncArray[0];
        enemyName = tempSyncArray[1];
        $("<div>Buena suerte, <strong>" + name + "</strong>, tu oponente es: <strong>" + tempSyncArray[1] + "</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        shipAssignment();
        startGame();
        return;
      } else {
        $("<div>Esperando jugador</div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
      }
    }, 3000);
  }

  var shipAssignment = function() {
      enemyFive = enemyShips[0];
      enemyFour = enemyShips[1];
      enemyThree = enemyShips[2];
      enemyTwo = enemyShips[3];
      enemyShips = [];
      for (var i = 0; i < enemyFive.length; i++) {
        enemyShips.push(enemyFive[i]);
      }
      for (var i = 0; i < enemyFour.length; i++) {
        enemyShips.push(enemyFour[i]);
      }
      for (var i = 0; i < enemyThree.length; i++) {
        enemyShips.push(enemyThree[i]);
      }
      for (var i = 0; i < enemyTwo.length; i++) {
        enemyShips.push(enemyTwo[i]);
      }
  }
  

  var startGame = function() {
    $('#moveInput').prop('readonly', false);
    $("<div>Iniciando juego...</div>").appendTo('#statusLog')
    var tempHeight = $('#statusLog')[0].scrollHeight;
    $('#statusLog').scrollTop(tempHeight);
    tempLocation = 'https://barquitos-42dff.firebaseio.com/datos/';
    tempFirebase = new Firebase(tempLocation);
    firebaseData = getSynchronizedArray(tempFirebase);
    firebaseData.$set('Turno', '0');
    turnCheck();
  }

  var turnCheck = function() {
    var isItMyTurn = setInterval(function() {
      syncArray();
      checkLoss();
      if (parseInt(firebaseData[2]) === 2) {
        clearInterval(isItMyTurn);
        return;
      }
      if (parseInt(firebaseData[2]) === myPlayerNumber) {
        clearInterval(isItMyTurn);
        if (firebaseData[3]) {
          registerEnemyTurn();
        }
        $("<div><strong>Es tu turno</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        registerTurn();
      } else {
        $("<div>Esperando jugador...</div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
      }
    }, 3000)
  }

  var syncArray = function() {
    tempLocation = 'https://barquitos-42dff.firebaseio.com/datos/';
    tempFirebase = new Firebase(tempLocation);
    firebaseData = getSynchronizedArray(tempFirebase);
  }

  var registerEnemyTurn = function() {
    var tempPos = '#' + firebaseData[3];
    if (firebaseData[4] === 'hGolpe') {
      $(tempPos).text('X');
      $(tempPos).css('background-color', 'red');
      $(tempPos).css('font-weight', 'bold');
    } else {
      $(tempPos).text('-');
      $(tempPos).css('background-color', '#F5D04C');
    }
  }

  var registerTurn = function() {
    $('.enemyBoardSquare').on('click', function() {
      var $turn = $(this).attr('id').slice(1);
      if (validTurn($turn)) {
        if (checkHit($turn)) {
          myTurns.push($turn);
          myHits.push($turn);
          checkSink($turn);
          if (checkVictory()) {
            setTimeout(function() {
              turnCheck();
            }, 3000);
            return;
          }
        } else {
          myTurns.push($turn);
        }
        $('.enemyBoardSquare').off();
        firebaseData.$set('Turno', enemyPlayerNumber.toString());
        setTimeout(function() {
          turnCheck();
        }, 3000);
        return;
      } else {
        return;
      }
    });
  };

  var checkHit = function(playerInput) {
 
    firebaseData.$set('pos', playerInput);
    for (var i = 0; i < enemyShips.length; i++) {
      if (enemyShips[i] === playerInput) {
        firebaseData.$set('sEstado', 'hGolpe')
        var audioBg = new Audio('media/Hit.mp3');
        audioBg.play();
        $("<div><strong> Disparo acertado en: " + playerInput + "</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        var tempID = '#e' + playerInput;
        $(tempID).text('X');
        $(tempID).css('background-color', 'red');
        $(tempID).css('font-weight', 'bold');
        return true;
      }
    }
    firebaseData.$set('sEstado', 'mFallido')
    $("<div>Disparo fallado en: " + playerInput + "</div>").appendTo('#statusLog')
    var tempHeight = $('#statusLog')[0].scrollHeight;
    $('#statusLog').scrollTop(tempHeight);
    var tempID = '#e' + playerInput;
    $(tempID).text('-');
    $(tempID).css('background-color', 'white');
    return false;
  }

  var checkSink = function(playerInput) {
    var sinkCount = 0;
    var currentShip;
    if (enemyFive.indexOf(playerInput) >= 0) {
      currentShip = enemyFive;
    } else if (enemyFour.indexOf(playerInput) >= 0) {
      currentShip = enemyFour;
    } else if (enemyThree.indexOf(playerInput) >= 0) {
      currentShip = enemyThree;
    } else if (enemyTwo.indexOf(playerInput) >= 0) {
      currentShip = enemyTwo;
    }
    if (currentShip) {
      for (var i = 0; i < currentShip.length; i++) {
        if (myHits.indexOf(currentShip[i]) >= 0) {
          sinkCount++;
        }
      }
      if (sinkCount === currentShip.length) {
        sinkShipMessage(currentShip.length);
        setTimeout(function() {
          audioBg.play();
        }, 3000);
        currentShip = undefined;
      }
    }
  };

  var sinkShipMessage = function(shipLength) {
    switch (shipLength) {
      case 5:
        $("<div><strong>BARCO HUNDIDO</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        break;
      case 4:
        $("<div><strong>BARCO HUNDIDO</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        break;
      case 3:
        $("<div><strong>BARCO HUNDIDO</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        break;
      case 2:
        $("<div><strong>BARCO HUNDIDO</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        break;
      default:
        $("<div><strong>BARCO HUNDIDO</strong></div>").appendTo('#statusLog')
        var tempHeight = $('#statusLog')[0].scrollHeight;
        $('#statusLog').scrollTop(tempHeight);
        break;
    }
  }

  var checkVictory = function() {
      var myHitsSort = myHits.sort();
    var enemyShipsSort = enemyShips.sort();
    if (myHitsSort.join('') === enemyShipsSort.join('')) {
      syncArray();
      firebaseData.$set('Turn', '2');
         setTimeout(function() {
        audioBg.play();
      }, 7000);
      $("<div><strong>¡GANASTE!</strong></div>").appendTo('#statusLog')
      var tempHeight = $('#statusLog')[0].scrollHeight;
      $('#statusLog').scrollTop(tempHeight);
      return true;
    } else {
      return false;
    }
  }

  var checkLoss = function() {
    if (parseInt(firebaseData[2]) === 2) {
      $("<div><strong>¡PERDISTE!</strong></div>").appendTo('#statusLog')
      var tempHeight = $('#statusLog')[0].scrollHeight;
      $('#statusLog').scrollTop(tempHeight);
      return;
    } else {
      return;
    }
  };

  var validTurn = function(playerInput) {
    for (var l = 0; l < myTurns.length; l++) {
      if (myTurns[l] === playerInput) {
        return false;
      }
    }
    for (var i = 0; i < boardArray.length; i++) {
      for (var j = 0; j < boardArray.length; j++) {
        if (boardArray[i][j] === playerInput);
        return true;
      }
    }
    return false;
  };
  $('#swapBoard').on('click', function() {
    $('.myBoardSquare, .enemyBoardSquare').toggle();
    if (buttonState === 0) {
      $('#swapBoard').html('Ver tu tablero');
      buttonState = 1;
    } else if (buttonState === 1) {
      $('#swapBoard').html('Ver tablero enemigo');
      buttonState = 0;
    }
  });
    function getSynchronizedArray(firebaseRef) {
    var list = [];
    syncChanges(list, firebaseRef);
    wrapLocalCrudOps(list, firebaseRef);
    return list;
  }

  function syncChanges(list, ref) {
    ref.on('child_added', function _add(snap, prevChild) {
      var data = snap.val();
      data.$id = snap.key(); 
      var pos = positionAfter(list, prevChild);
      list.splice(pos, 0, data);
    });
    ref.on('child_removed', function _remove(snap) {
      var i = positionFor(list, snap.key());
      if (i > -1) {
        list.splice(i, 1);
      }
    });
    ref.on('child_changed', function _change(snap) {
      var i = positionFor(list, snap.key());
      if (i > -1) {
        list[i] = snap.val();
        list[i].$id = snap.key(); 
      }
    });
    ref.on('child_moved', function _move(snap, prevChild) {
      var curPos = positionFor(list, snap.key());
      if (curPos > -1) {
        var data = list.splice(curPos, 1)[0];
        var newPos = positionAfter(list, prevChild);
        list.splice(newPos, 0, data);
      }
    });
  }

  function positionFor(list, key) {
    for (var i = 0, len = list.length; i < len; i++) {
      if (list[i].$id === key) {
        return i;
      }
    }
    return -1;
  }

  function positionAfter(list, prevChild) {
    if (prevChild === null) {
      return 0;
    } else {
      var i = positionFor(list, prevChild);
      if (i === -1) {
        return list.length;
      } else {
        return i + 1;
      }
    }
  }

  function wrapLocalCrudOps(list, firebaseRef) {
      list.$add = function(data) {
        return firebaseRef.push(data);
      };
      list.$remove = function(key) {
        firebaseRef.child(key).remove();
      };
      list.$set = function(key, newData) {
        if (newData.hasOwnProperty('$id')) {
          delete newData.$id;
        }
        firebaseRef.child(key).set(newData);
      };
      list.$indexOf = function(key) {
        return positionFor(list, key); 
      }
    }
});
