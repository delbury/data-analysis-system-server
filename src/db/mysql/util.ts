// index 转换成字母
export const transferNumber2Char = (n: number) => {
  let res = '';
  do {
    const offset = n % 26;
    res = String.fromCharCode(97 + offset) + res;
    n = Math.floor(n / 26);
  } while(n);
  return res;
};
