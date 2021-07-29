
// @ts-nocheck

function ColorBox(colorRange, total, data) {
  this.colorRange = colorRange;
  this.total = total;
  this.data = data;
  this.volume = (colorRange[0][1] - colorRange[0][0]) * (colorRange[1][1] - colorRange[1][0]) * (colorRange[2][1] - colorRange[2][0]);
  this.rank = this.total * (this.volume);
}

ColorBox.prototype.getColor = function () {
  const total = this.total;
  const data = this.data;
  let redCount = 0;
  let greenCount = 0;
  let blueCount = 0;

  for (let i = 0; i < total; i++) {
    redCount += data[i * 4];
    greenCount += data[i * 4 + 1];
    blueCount += data[i * 4 + 2];
  }
  // tslint:disable-next-line:radix
  return [parseInt(redCount / total), parseInt(greenCount / total), parseInt(blueCount / total)];
};

// 获取切割边
function getCutSide(colorRange) {   // r:0,g:1,b:2
  const arr = [];
  for (let i = 0; i < 3; i++) {
    arr.push(colorRange[i][1] - colorRange[i][0]);
  }
  return arr.indexOf(Math.max(arr[0], arr[1], arr[2]));
}

// 切割颜色范围
function cutRange(colorRange, colorSide, cutValue) {
  const arr1 = [];
  const arr2 = [];
  colorRange.forEach(function (item) {
    arr1.push(item.slice());
    arr2.push(item.slice());
  });
  arr1[colorSide][1] = cutValue;
  arr2[colorSide][0] = cutValue;
  return [arr1, arr2];
}

// 找到出现次数为中位数的颜色
function getMedianColor(colorCountMap, total) {
  const arr = [];
  // tslint:disable-next-line:forin
  for (const key in colorCountMap) {
    arr.push({
      // tslint:disable-next-line: radix
      color: parseInt(key),
      count: colorCountMap[key]
    });
  }

  const sortArr = __quickSort(arr);
  let medianCount = 0;
  const medianColor = 0;
  const medianIndex = Math.floor(sortArr.length / 2);

  for (let i = 0; i <= medianIndex; i++) {
    medianCount += sortArr[i].count;
  }

  return {
    // tslint:disable-next-line: radix
    color: parseInt(sortArr[medianIndex].color),
    count: medianCount
  };

  // 快排
  function __quickSort(arr) {
    if (arr.length <= 1) {
      return arr;
    }
    // tslint:disable-next-line: one-variable-per-declaration
    const pivotIndex = Math.floor(arr.length / 2),
      pivot = arr.splice(pivotIndex, 1)[0];

    const left = [];
    const right = [];
    for (let i = 0; i < arr.length; i++) {
      if (arr[i].count <= pivot.count) {
        left.push(arr[i]);
      }
      else {
        right.push(arr[i]);
      }
    }
    return __quickSort(left).concat([pivot], __quickSort(right));
  }
}

// 切割颜色盒子
function cutBox(colorBox) {
  // tslint:disable-next-line: one-variable-per-declaration
  const colorRange = colorBox.colorRange,
    cutSide = getCutSide(colorRange),
    colorCountMap = {},
    total = colorBox.total,
    data = colorBox.data;

  // 统计出各个值的数量
  for (let i = 0; i < total; i++) {
    const color = data[i * 4 + cutSide];

    if (colorCountMap[color]) {
      colorCountMap[color] += 1;
    }
    else {
      colorCountMap[color] = 1;
    }
  }
  const medianColor = getMedianColor(colorCountMap, total);
  const cutValue = medianColor.color;
  const cutCount = medianColor.count;
  const newRange = cutRange(colorRange, cutSide, cutValue);
  const box1 = new ColorBox(newRange[0], cutCount, data.slice(0, cutCount * 4));
  const box2 = new ColorBox(newRange[1], total - cutCount, data.slice(cutCount * 4));
  return [box1, box2];
}

// 队列切割
function queueCut(queue, num) {

  while (queue.length < num) {

    queue.sort(function (a, b) {
      return a.rank - b.rank;
    });
    const colorBox = queue.pop();
    const result = cutBox(colorBox);
    queue = queue.concat(result);
  }

  return queue.slice(0, 8);
}

function themeColor(img, callback, chunkNum = 8) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let imageData = null;

  width = canvas.width = img.width;
  height = canvas.height = img.height;

  ctx.drawImage(img, 0, 0, width, height);
  imageData = ctx.getImageData(0, 0, width, height).data;
  const total = imageData.length / 4;
  let rMin = 255;
  let rMax = 0;
  let gMin = 255;
  let gMax = 0;
  let bMin = 255;
  let bMax = 0;
  // 获取范围
  for (let i = 0; i < total; i++) {
    // tslint:disable-next-line: one-variable-per-declaration
    const red = imageData[i * 4],
      green = imageData[i * 4 + 1],
      blue = imageData[i * 4 + 2];

    if (red < rMin) {
      rMin = red;
    }

    if (red > rMax) {
      rMax = red;
    }

    if (green < gMin) {
      gMin = green;
    }

    if (green > gMax) {
      gMax = green;
    }

    if (blue < bMin) {
      bMin = blue;
    }

    if (blue > bMax) {
      bMax = blue;
    }
  }

  const colorRange = [[rMin, rMax], [gMin, gMax], [bMin, bMax]];
  const colorBox = new ColorBox(colorRange, total, imageData);

  const colorBoxArr = queueCut([colorBox], chunkNum);

  const colorArr = [];
  for (let j = 0; j < colorBoxArr.length; j++) {
    colorBoxArr[j].total && colorArr.push(colorBoxArr[j].getColor());
  }

  callback(colorArr);
}

export default themeColor;