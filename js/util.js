'use strict'

function createMat(rows, cols) {
    const mat = []

    for (var i = 0; i < rows; i++) {
        const row = []
        
        for (var j = 0; j < cols; j++) {
            row.push('')
        }
        mat.push(row)
    }
    return mat
}

function getRandomInt(min, max) {
    min = Math.ceil(min)
    max = Math.floor(max)
    return Math.floor(Math.random() * (max - min)) + min
}