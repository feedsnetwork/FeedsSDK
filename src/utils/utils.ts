import BigNumber from 'bignumber.js';

const TAG = 'utils';

export class utils {
  /**
   *
   * Secure Hash Algorithm (SHA256)
   * http://www.webtoolkit.info/
   *
   * Original code by Angel Marin, Paul Johnston.
   *
   **/
  public static SHA256(s: string) {
    var chrsz = 8;
    var hexcase = 0;
    function safe_add(x, y) {
      var lsw = (x & 0xffff) + (y & 0xffff);
      var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      return (msw << 16) | (lsw & 0xffff);
    }
    function S(X, n) {
      return (X >>> n) | (X << (32 - n));
    }
    function R(X, n) {
      return X >>> n;
    }
    function Ch(x, y, z) {
      return (x & y) ^ (~x & z);
    }
    function Maj(x, y, z) {
      return (x & y) ^ (x & z) ^ (y & z);
    }
    function Sigma0256(x) {
      return S(x, 2) ^ S(x, 13) ^ S(x, 22);
    }
    function Sigma1256(x) {
      return S(x, 6) ^ S(x, 11) ^ S(x, 25);
    }
    function Gamma0256(x) {
      return S(x, 7) ^ S(x, 18) ^ R(x, 3);
    }
    function Gamma1256(x) {
      return S(x, 17) ^ S(x, 19) ^ R(x, 10);
    }
    function core_sha256(m, l) {
      var K = [
        0x428a2f98,
        0x71374491,
        0xb5c0fbcf,
        0xe9b5dba5,
        0x3956c25b,
        0x59f111f1,
        0x923f82a4,
        0xab1c5ed5,
        0xd807aa98,
        0x12835b01,
        0x243185be,
        0x550c7dc3,
        0x72be5d74,
        0x80deb1fe,
        0x9bdc06a7,
        0xc19bf174,
        0xe49b69c1,
        0xefbe4786,
        0xfc19dc6,
        0x240ca1cc,
        0x2de92c6f,
        0x4a7484aa,
        0x5cb0a9dc,
        0x76f988da,
        0x983e5152,
        0xa831c66d,
        0xb00327c8,
        0xbf597fc7,
        0xc6e00bf3,
        0xd5a79147,
        0x6ca6351,
        0x14292967,
        0x27b70a85,
        0x2e1b2138,
        0x4d2c6dfc,
        0x53380d13,
        0x650a7354,
        0x766a0abb,
        0x81c2c92e,
        0x92722c85,
        0xa2bfe8a1,
        0xa81a664b,
        0xc24b8b70,
        0xc76c51a3,
        0xd192e819,
        0xd6990624,
        0xf40e3585,
        0x106aa070,
        0x19a4c116,
        0x1e376c08,
        0x2748774c,
        0x34b0bcb5,
        0x391c0cb3,
        0x4ed8aa4a,
        0x5b9cca4f,
        0x682e6ff3,
        0x748f82ee,
        0x78a5636f,
        0x84c87814,
        0x8cc70208,
        0x90befffa,
        0xa4506ceb,
        0xbef9a3f7,
        0xc67178f2,
      ];
      var HASH = [
        0x6a09e667,
        0xbb67ae85,
        0x3c6ef372,
        0xa54ff53a,
        0x510e527f,
        0x9b05688c,
        0x1f83d9ab,
        0x5be0cd19,
      ];
      var W = new Array(64);
      var a, b, c, d, e, f, g, h, i, j;
      var T1, T2;
      m[l >> 5] |= 0x80 << (24 - (l % 32));
      m[(((l + 64) >> 9) << 4) + 15] = l;
      for (let i = 0; i < m.length; i += 16) {
        a = HASH[0];
        b = HASH[1];
        c = HASH[2];
        d = HASH[3];
        e = HASH[4];
        f = HASH[5];
        g = HASH[6];
        h = HASH[7];
        for (let j = 0; j < 64; j++) {
          if (j < 16) W[j] = m[j + i];
          else
            W[j] = safe_add(
              safe_add(
                safe_add(Gamma1256(W[j - 2]), W[j - 7]),
                Gamma0256(W[j - 15]),
              ),
              W[j - 16],
            );
          T1 = safe_add(
            safe_add(safe_add(safe_add(h, Sigma1256(e)), Ch(e, f, g)), K[j]),
            W[j],
          );
          T2 = safe_add(Sigma0256(a), Maj(a, b, c));
          h = g;
          g = f;
          f = e;
          e = safe_add(d, T1);
          d = c;
          c = b;
          b = a;
          a = safe_add(T1, T2);
        }
        HASH[0] = safe_add(a, HASH[0]);
        HASH[1] = safe_add(b, HASH[1]);
        HASH[2] = safe_add(c, HASH[2]);
        HASH[3] = safe_add(d, HASH[3]);
        HASH[4] = safe_add(e, HASH[4]);
        HASH[5] = safe_add(f, HASH[5]);
        HASH[6] = safe_add(g, HASH[6]);
        HASH[7] = safe_add(h, HASH[7]);
      }
      return HASH;
    }
    function str2binb(str) {
      var bin = [];
      var mask = (1 << chrsz) - 1;
      for (var i = 0; i < str.length * chrsz; i += chrsz) {
        bin[i >> 5] |= (str.charCodeAt(i / chrsz) & mask) << (24 - (i % 32));
      }
      return bin;
    }
    function Utf8Encode(string) {
      string = string.replace(/\r\n/g, '\n');
      var utftext = '';
      for (var n = 0; n < string.length; n++) {
        var c = string.charCodeAt(n);
        if (c < 128) {
          utftext += String.fromCharCode(c);
        } else if (c > 127 && c < 2048) {
          utftext += String.fromCharCode((c >> 6) | 192);
          utftext += String.fromCharCode((c & 63) | 128);
        } else {
          utftext += String.fromCharCode((c >> 12) | 224);
          utftext += String.fromCharCode(((c >> 6) & 63) | 128);
          utftext += String.fromCharCode((c & 63) | 128);
        }
      }
      return utftext;
    }
    function binb2hex(binarray) {
      var hex_tab = hexcase ? '0123456789ABCDEF' : '0123456789abcdef';
      var str = '';
      for (var i = 0; i < binarray.length * 4; i++) {
        str +=
          hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8 + 4)) & 0xf) +
          hex_tab.charAt((binarray[i >> 2] >> ((3 - (i % 4)) * 8)) & 0xf);
      }
      return str;
    }
    s = Utf8Encode(s);
    return binb2hex(core_sha256(str2binb(s), s.length * chrsz));
  }

  public static gethtmlId(
    page: string,
    type: string,
    nodeId: string,
    feedId: string,
    postId: string,
  ) {
    return page + '-' + type + '-' + nodeId + '-' + feedId + '-' + postId
  }

  public static generatePostId(did: string, channelId: string, postContent: string): string {
    const currentTime = utils.getCurrentTimeNum() / (1000 * 10)
    return utils.SHA256(did + channelId + postContent + currentTime)
  }

  public static generateCommentId(did: string, postId: string, refCommentId: string, commentContent: string): string {
    const currentTime = utils.getCurrentTimeNum() / (1000 * 10)
    return utils.SHA256(did + postId + refCommentId + commentContent + currentTime)
  }

  public static generateChannelId(did: string, channelName: string): string {
    return utils.SHA256(did + channelName)
  }

  public static generateLikeId(postId: string, commentId: string, userDid: string): string {
    return utils.SHA256(postId + commentId + userDid)
  }

  public static getCurrentTimeNum(): number {
    return new Date().getTime()
  }

  public static base64ToBlob(base64Data: string): Blob {
    const defaultType = 'image/png';
    let arr = base64Data.split(',');
    let mime = arr[0].match(/:(.*?);/)[1] || defaultType;
    let bytes = atob(arr[1]);
    let n = bytes.length || 0;

    let u8Array = new Uint8Array(n);
    while (n--) {
      u8Array[n] = bytes.charCodeAt(n);
    }

    return new Blob([u8Array], {
      type: mime
    });
  }

  public static compress(imgData: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (imgData.length < 50 * 1000) {
        resolve(imgData);
        return;
      }
      let image = new Image(); //新建一个img标签（不嵌入DOM节点，仅做canvas操作)
      image.src = imgData; //让该标签加载base64格式的原图
      image.onload = () => {
        let maxWidth = image.width / 4;
        let maxHeight = image.height / 4;
        let imgBase64 = utils.resizeImg(image, maxWidth, maxHeight, 1);
        resolve(imgBase64);
      };
    });
  }


  /**
  * 压缩图片
  * @param img img对象
  * @param maxWidth 最大宽
  * @param maxHeight 最大高
  * @param quality 压缩质量
  * @returns {string|*} 返回base64
  */
  public static resizeImg(img: any, maxWidth: any, maxHeight: any, quality = 1): any {
    const imageData: string = img.src;
    if (!imageData.startsWith("https") && imageData.length < maxWidth * maxHeight) {
      return imageData;
    }
    const imgWidth = img.width;
    const imgHeight = img.height;
    if (imgWidth <= 0 || imgHeight <= 0) {
      return imageData;
    }
    const canvasSize = this.zoomImgSize(imgWidth, imgHeight, maxWidth, maxHeight);
    const canvas = document.createElement('canvas');
    canvas.width = canvasSize[0];
    canvas.height = canvasSize[1];
    canvas.getContext('2d')
      .drawImage(img, 0, 0, canvas.width,
        canvas.height);
    return canvas.toDataURL('image/*', quality);
  }

  /**
  * 计算缩放宽高
  * @param imgWidth 图片宽
  * @param imgHeight 图片高
  * @param maxWidth 期望的最大宽
  * @param maxHeight 期望的最大高
  * @returns [number,number] 宽高
  */
  public static zoomImgSize(imgWidth: any, imgHeight: any, maxWidth: any, maxHeight: any) {
    let newWidth = imgWidth,
      newHeight = imgHeight;
    if (imgWidth / imgHeight >= maxWidth / maxHeight) {
      if (imgWidth > maxWidth) {
        newWidth = maxWidth;
        newHeight = (imgHeight * maxWidth) / imgWidth;
      }
    } else {
      if (imgHeight > maxHeight) {
        newHeight = maxHeight;
        newWidth = (imgWidth * maxHeight) / imgHeight;
      }
    }
    if (newWidth > maxWidth || newHeight > maxHeight) {
      //不满足预期,递归再次计算
      return this.zoomImgSize(newWidth, newHeight, maxWidth, maxHeight);
    }
    return [newWidth, newHeight];
  }

  private static defaultAvatar = {
    "assets/images/profile-1.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjJfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4NjIg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM1NCIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNTQiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1JlY3RhbmdsZV80MDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzQ5NGU1MyIgZGF0YS1uYW1lPSJSZWN0YW5nbGUgNDA2Ij4KICAgICAgICAgICAgPHJlY3Qgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBzdHJva2U9Im5vbmUiIHJ4PSIzNyIvPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNzMiIGhlaWdodD0iNzMiIHg9Ii41IiB5PSIuNSIgcng9IjM2LjUiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODUyXzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1MiDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiM3ODc4NzkiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iIzQ5NGU1MyIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDEgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iIzQwM2E0YSIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAxIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-2.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjRfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4NjQg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM1OCIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNTgiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjNfMSIgZGF0YS1uYW1lPSJDb21wb25lbnQgODYzIOKAkyAxIj4KICAgICAgICAgICAgPGcgaWQ9InByZWZpeF9fUGF0aF8yMjIwIiBmaWxsPSJub25lIiBzdHJva2U9Im5vbmUiIGRhdGEtbmFtZT0iUGF0aCAyMjIwIj4KICAgICAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNyAwQTM3IDM3IDAgMSAxIDAgMzcgMzcgMzcgMCAwIDEgMzcgMHoiLz4KICAgICAgICAgICAgICAgIDxwYXRoIGZpbGw9IiMzNjhiZmYiIGQ9Ik0zNyAxYy00Ljg2IDAtOS41NzUuOTUyLTE0LjAxMyAyLjgyOS00LjI4NiAxLjgxMy04LjEzNiA0LjQwOS0xMS40NDMgNy43MTUtMy4zMDYgMy4zMDctNS45MDIgNy4xNTctNy43MTUgMTEuNDQzQzEuOTUyIDI3LjQyNSAxIDMyLjE0IDEgMzdjMCA0Ljg2Ljk1MiA5LjU3NSAyLjgyOSAxNC4wMTMgMS44MTMgNC4yODYgNC40MDkgOC4xMzYgNy43MTUgMTEuNDQzIDMuMzA3IDMuMzA2IDcuMTU3IDUuOTAyIDExLjQ0MyA3LjcxNUMyNy40MjUgNzIuMDQ4IDMyLjE0IDczIDM3IDczYzQuODYgMCA5LjU3NS0uOTUyIDE0LjAxMy0yLjgyOSA0LjI4Ni0xLjgxMyA4LjEzNi00LjQwOSAxMS40NDMtNy43MTUgMy4zMDYtMy4zMDcgNS45MDItNy4xNTcgNy43MTUtMTEuNDQzQzcyLjA0OCA0Ni41NzUgNzMgNDEuODYgNzMgMzdjMC00Ljg2LS45NTItOS41NzUtMi44MjktMTQuMDEzLTEuODEzLTQuMjg2LTQuNDA5LTguMTM2LTcuNzE1LTExLjQ0My0zLjMwNy0zLjMwNi03LjE1Ny01LjkwMi0xMS40NDMtNy43MTVDNDYuNTc1IDEuOTUyIDQxLjg2IDEgMzcgMW0wLTFjMjAuNDM1IDAgMzcgMTYuNTY1IDM3IDM3UzU3LjQzNSA3NCAzNyA3NCAwIDU3LjQzNSAwIDM3IDE2LjU2NSAwIDM3IDB6Ii8+CiAgICAgICAgICAgIDwvZz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODUzXzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1MyDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTQuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiNhMDY3ZmYiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iIzM2OGJmZiIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDEgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iIzc2MjRmZSIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAxIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-3.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjVfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4NjUg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM2MCIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNjAiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1BhdGhfMjIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiBkYXRhLW5hbWU9IlBhdGggMjIyMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNyAwQTM3IDM3IDAgMSAxIDAgMzcgMzcgMzcgMCAwIDEgMzcgMHoiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iI2Y1NTU1NSIgZD0iTTM3IDFjLTQuODYgMC05LjU3NS45NTItMTQuMDEzIDIuODI5LTQuMjg2IDEuODEzLTguMTM2IDQuNDA5LTExLjQ0MyA3LjcxNS0zLjMwNiAzLjMwNy01LjkwMiA3LjE1Ny03LjcxNSAxMS40NDNDMS45NTIgMjcuNDI1IDEgMzIuMTQgMSAzN2MwIDQuODYuOTUyIDkuNTc1IDIuODI5IDE0LjAxMyAxLjgxMyA0LjI4NiA0LjQwOSA4LjEzNiA3LjcxNSAxMS40NDMgMy4zMDcgMy4zMDYgNy4xNTcgNS45MDIgMTEuNDQzIDcuNzE1QzI3LjQyNSA3Mi4wNDggMzIuMTQgNzMgMzcgNzNjNC44NiAwIDkuNTc1LS45NTIgMTQuMDEzLTIuODI5IDQuMjg2LTEuODEzIDguMTM2LTQuNDA5IDExLjQ0My03LjcxNSAzLjMwNi0zLjMwNyA1LjkwMi03LjE1NyA3LjcxNS0xMS40NDNDNzIuMDQ4IDQ2LjU3NSA3MyA0MS44NiA3MyAzN2MwLTQuODYtLjk1Mi05LjU3NS0yLjgyOS0xNC4wMTMtMS44MTMtNC4yODYtNC40MDktOC4xMzYtNy43MTUtMTEuNDQzLTMuMzA3LTMuMzA2LTcuMTU3LTUuOTAyLTExLjQ0My03LjcxNUM0Ni41NzUgMS45NTIgNDEuODYgMSAzNyAxbTAtMWMyMC40MzUgMCAzNyAxNi41NjUgMzcgMzdTNTcuNDM1IDc0IDM3IDc0IDAgNTcuNDM1IDAgMzcgMTYuNTY1IDAgMzcgMHoiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODU0XzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1NCDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTMuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiNmZjY5NjkiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iI2Y0NDU0NSIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDIgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iI2QxMzgzOCIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAyIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-4.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjZfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4NjYg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM2MiIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNjIiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1BhdGhfMjIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiBkYXRhLW5hbWU9IlBhdGggMjIyMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNyAwQTM3IDM3IDAgMSAxIDAgMzcgMzcgMzcgMCAwIDEgMzcgMHoiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iIzQxZjBhZCIgZD0iTTM3IDFjLTQuODYgMC05LjU3NS45NTItMTQuMDEzIDIuODI5LTQuMjg2IDEuODEzLTguMTM2IDQuNDA5LTExLjQ0MyA3LjcxNS0zLjMwNiAzLjMwNy01LjkwMiA3LjE1Ny03LjcxNSAxMS40NDNDMS45NTIgMjcuNDI1IDEgMzIuMTQgMSAzN2MwIDQuODYuOTUyIDkuNTc1IDIuODI5IDE0LjAxMyAxLjgxMyA0LjI4NiA0LjQwOSA4LjEzNiA3LjcxNSAxMS40NDMgMy4zMDcgMy4zMDYgNy4xNTcgNS45MDIgMTEuNDQzIDcuNzE1QzI3LjQyNSA3Mi4wNDggMzIuMTQgNzMgMzcgNzNjNC44NiAwIDkuNTc1LS45NTIgMTQuMDEzLTIuODI5IDQuMjg2LTEuODEzIDguMTM2LTQuNDA5IDExLjQ0My03LjcxNSAzLjMwNi0zLjMwNyA1LjkwMi03LjE1NyA3LjcxNS0xMS40NDNDNzIuMDQ4IDQ2LjU3NSA3MyA0MS44NiA3MyAzN2MwLTQuODYtLjk1Mi05LjU3NS0yLjgyOS0xNC4wMTMtMS44MTMtNC4yODYtNC40MDktOC4xMzYtNy43MTUtMTEuNDQzLTMuMzA3LTMuMzA2LTcuMTU3LTUuOTAyLTExLjQ0My03LjcxNUM0Ni41NzUgMS45NTIgNDEuODYgMSAzNyAxbTAtMWMyMC40MzUgMCAzNyAxNi41NjUgMzcgMzdTNTcuNDM1IDc0IDM3IDc0IDAgNTcuNDM1IDAgMzcgMTYuNTY1IDAgMzcgMHoiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODU1XzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1NSDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiM3OGNlYTMiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iIzQ4ZGQ5MiIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDIgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iIzMyYjQ3MiIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAyIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-5.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjdfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4Njcg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM1NSIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNTUiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1JlY3RhbmdsZV80MDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzQ5NGZjNCIgZGF0YS1uYW1lPSJSZWN0YW5nbGUgNDA2Ij4KICAgICAgICAgICAgPHJlY3Qgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBzdHJva2U9Im5vbmUiIHJ4PSIzNyIvPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNzMiIGhlaWdodD0iNzMiIHg9Ii41IiB5PSIuNSIgcng9IjM2LjUiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODU2XzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1NiDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiM4MTg3ZWQiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iIzQxNDhjNyIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDEgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iIzM5M2U5ZiIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAxIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-6.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjhfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4Njgg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM1OSIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNTkiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1BhdGhfMjIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiBkYXRhLW5hbWU9IlBhdGggMjIyMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNyAwQTM3IDM3IDAgMSAxIDAgMzcgMzcgMzcgMCAwIDEgMzcgMHoiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iI2ZmYmQ0MCIgZD0iTTM3IDFjLTQuODYgMC05LjU3NS45NTItMTQuMDEzIDIuODI5LTQuMjg2IDEuODEzLTguMTM2IDQuNDA5LTExLjQ0MyA3LjcxNS0zLjMwNiAzLjMwNy01LjkwMiA3LjE1Ny03LjcxNSAxMS40NDNDMS45NTIgMjcuNDI1IDEgMzIuMTQgMSAzN2MwIDQuODYuOTUyIDkuNTc1IDIuODI5IDE0LjAxMyAxLjgxMyA0LjI4NiA0LjQwOSA4LjEzNiA3LjcxNSAxMS40NDMgMy4zMDcgMy4zMDYgNy4xNTcgNS45MDIgMTEuNDQzIDcuNzE1QzI3LjQyNSA3Mi4wNDggMzIuMTQgNzMgMzcgNzNjNC44NiAwIDkuNTc1LS45NTIgMTQuMDEzLTIuODI5IDQuMjg2LTEuODEzIDguMTM2LTQuNDA5IDExLjQ0My03LjcxNSAzLjMwNi0zLjMwNyA1LjkwMi03LjE1NyA3LjcxNS0xMS40NDNDNzIuMDQ4IDQ2LjU3NSA3MyA0MS44NiA3MyAzN2MwLTQuODYtLjk1Mi05LjU3NS0yLjgyOS0xNC4wMTMtMS44MTMtNC4yODYtNC40MDktOC4xMzYtNy43MTUtMTEuNDQzLTMuMzA3LTMuMzA2LTcuMTU3LTUuOTAyLTExLjQ0My03LjcxNUM0Ni41NzUgMS45NTIgNDEuODYgMSAzNyAxbTAtMWMyMC40MzUgMCAzNyAxNi41NjUgMzcgMzdTNTcuNDM1IDc0IDM3IDc0IDAgNTcuNDM1IDAgMzcgMTYuNTY1IDAgMzcgMHoiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODU3XzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1NyDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTQuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiNmZmUwNzQiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iI2ZmYzYwMCIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDEgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iI2RlYWQwMCIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAxIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-7.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NjlfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4Njkg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM2MSIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNjEiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1BhdGhfMjIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiBkYXRhLW5hbWU9IlBhdGggMjIyMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNyAwQTM3IDM3IDAgMSAxIDAgMzcgMzcgMzcgMCAwIDEgMzcgMHoiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iI2ZmODZmNiIgZD0iTTM3IDFjLTQuODYgMC05LjU3NS45NTItMTQuMDEzIDIuODI5LTQuMjg2IDEuODEzLTguMTM2IDQuNDA5LTExLjQ0MyA3LjcxNS0zLjMwNiAzLjMwNy01LjkwMiA3LjE1Ny03LjcxNSAxMS40NDNDMS45NTIgMjcuNDI1IDEgMzIuMTQgMSAzN2MwIDQuODYuOTUyIDkuNTc1IDIuODI5IDE0LjAxMyAxLjgxMyA0LjI4NiA0LjQwOSA4LjEzNiA3LjcxNSAxMS40NDMgMy4zMDcgMy4zMDYgNy4xNTcgNS45MDIgMTEuNDQzIDcuNzE1QzI3LjQyNSA3Mi4wNDggMzIuMTQgNzMgMzcgNzNjNC44NiAwIDkuNTc1LS45NTIgMTQuMDEzLTIuODI5IDQuMjg2LTEuODEzIDguMTM2LTQuNDA5IDExLjQ0My03LjcxNSAzLjMwNi0zLjMwNyA1LjkwMi03LjE1NyA3LjcxNS0xMS40NDNDNzIuMDQ4IDQ2LjU3NSA3MyA0MS44NiA3MyAzN2MwLTQuODYtLjk1Mi05LjU3NS0yLjgyOS0xNC4wMTMtMS44MTMtNC4yODYtNC40MDktOC4xMzYtNy43MTUtMTEuNDQzLTMuMzA3LTMuMzA2LTcuMTU3LTUuOTAyLTExLjQ0My03LjcxNUM0Ni41NzUgMS45NTIgNDEuODYgMSAzNyAxbTAtMWMyMC40MzUgMCAzNyAxNi41NjUgMzcgMzdTNTcuNDM1IDc0IDM3IDc0IDAgNTcuNDM1IDAgMzcgMTYuNTY1IDAgMzcgMHoiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODU4XzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1OCDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTMuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiNmZjg2ZjYiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iI2U4NTNkZCIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDIgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iI2M3NGRiZSIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAyIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-8.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NzBfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4NzAg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM2MyIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNjMiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1BhdGhfMjIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJub25lIiBkYXRhLW5hbWU9IlBhdGggMjIyMCI+CiAgICAgICAgICAgIDxwYXRoIGQ9Ik0zNyAwQTM3IDM3IDAgMSAxIDAgMzcgMzcgMzcgMCAwIDEgMzcgMHoiLz4KICAgICAgICAgICAgPHBhdGggZmlsbD0iI2ZmYjQ4ZCIgZD0iTTM3IDFjLTQuODYgMC05LjU3NS45NTItMTQuMDEzIDIuODI5LTQuMjg2IDEuODEzLTguMTM2IDQuNDA5LTExLjQ0MyA3LjcxNS0zLjMwNiAzLjMwNy01LjkwMiA3LjE1Ny03LjcxNSAxMS40NDNDMS45NTIgMjcuNDI1IDEgMzIuMTQgMSAzN2MwIDQuODYuOTUyIDkuNTc1IDIuODI5IDE0LjAxMyAxLjgxMyA0LjI4NiA0LjQwOSA4LjEzNiA3LjcxNSAxMS40NDMgMy4zMDcgMy4zMDYgNy4xNTcgNS45MDIgMTEuNDQzIDcuNzE1QzI3LjQyNSA3Mi4wNDggMzIuMTQgNzMgMzcgNzNjNC44NiAwIDkuNTc1LS45NTIgMTQuMDEzLTIuODI5IDQuMjg2LTEuODEzIDguMTM2LTQuNDA5IDExLjQ0My03LjcxNSAzLjMwNi0zLjMwNyA1LjkwMi03LjE1NyA3LjcxNS0xMS40NDNDNzIuMDQ4IDQ2LjU3NSA3MyA0MS44NiA3MyAzN2MwLTQuODYtLjk1Mi05LjU3NS0yLjgyOS0xNC4wMTMtMS44MTMtNC4yODYtNC40MDktOC4xMzYtNy43MTUtMTEuNDQzLTMuMzA3LTMuMzA2LTcuMTU3LTUuOTAyLTExLjQ0My03LjcxNUM0Ni41NzUgMS45NTIgNDEuODYgMSAzNyAxbTAtMWMyMC40MzUgMCAzNyAxNi41NjUgMzcgMzdTNTcuNDM1IDc0IDM3IDc0IDAgNTcuNDM1IDAgMzcgMTYuNTY1IDAgMzcgMHoiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODU5XzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg1OSDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuMTU2IDIxLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiNmZmNhYWYiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iI2ZmYjQ4ZCIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDIgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iI2UwYTE4MCIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAyIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
    "assets/images/profile-9.svg": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIGlkPSJwcmVmaXhfX0NvbXBvbmVudF84NzFfMSIgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBkYXRhLW5hbWU9IkNvbXBvbmVudCA4NzEg4oCTIDEiIHZpZXdCb3g9IjAgMCA3NCA3NCI+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfMzA3XzM1NiIgZGF0YS1uYW1lPSJDb21wb25lbnQgMzA3IOKAkyAzNTYiPgogICAgICAgIDxnIGlkPSJwcmVmaXhfX1JlY3RhbmdsZV80MDYiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzljNTBmZiIgZGF0YS1uYW1lPSJSZWN0YW5nbGUgNDA2Ij4KICAgICAgICAgICAgPHJlY3Qgd2lkdGg9Ijc0IiBoZWlnaHQ9Ijc0IiBzdHJva2U9Im5vbmUiIHJ4PSIzNyIvPgogICAgICAgICAgICA8cmVjdCB3aWR0aD0iNzMiIGhlaWdodD0iNzMiIHg9Ii41IiB5PSIuNSIgcng9IjM2LjUiLz4KICAgICAgICA8L2c+CiAgICA8L2c+CiAgICA8ZyBpZD0icHJlZml4X19Db21wb25lbnRfODYwXzEiIGRhdGEtbmFtZT0iQ29tcG9uZW50IDg2MCDigJMgMSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoMTUuMTU2IDIyLjUxMikiPgogICAgICAgIDxwYXRoIGlkPSJwcmVmaXhfX1BhdGhfMjE2ODkiIGZpbGw9IiNhMDY3ZmYiIGQ9Ik0xNjkyLjgwNyA4MjAyLjIxN2MtMS43NzItLjg3My0yLjgzMi0zLjE1NC0yLjgzNy02LjF2LTEuNGMuMDIxLS4yMzkuMDMxLS40NzcuMDMxLS43MDhsLS4wMTItNy45NjdhNy45IDcuOSAwIDAgMC03Ljg5MS03Ljg3OWgtLjAxMmwtMTUuMi4wMjNhNy45IDcuOSAwIDAgMC03Ljg4IDcuOWwuMDEyIDcuOTY3YTcuOSA3LjkgMCAwIDAgNy44OTEgNy44NzhoLjAxMmwxNS4yLS4wMjJhNy44MDggNy44MDggMCAwIDAgNC40NzMtMS40IDExLjk0NCAxMS45NDQgMCAwIDAgNi4xNzggMS44NjhsLjM2MS4wMDZ6IiBkYXRhLW5hbWU9IlBhdGggMjE2ODkiIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xNjU5LjAwNSAtODE3Mi4xOTcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MCIgZmlsbD0iIzdkMmZmZiIgZD0iTTE3OTEuNCA4MTUxLjA2OGMtMS43OTEtLjg4OS0yLjg2LTMuMTg5LTIuODYtNi4xNTd2LTEuNDFjLjAyMS0uMjI5LjAzMS0uNDY3LjAzMS0uN3YtNy45NjVhNy44NDIgNy44NDIgMCAwIDAtNy44MzMtNy44MzRoLTE1LjJhNy44NDIgNy44NDIgMCAwIDAtNy44MzMgNy44MzR2Ny45NjVhNy44NDIgNy44NDIgMCAwIDAgNy44MzMgNy44MzRoMTUuMmE3Ljc5MiA3Ljc5MiAwIDAgMCA0LjQ3My0xLjQwNyAxMS44NjMgMTEuODYzIDAgMCAwIDYuMTc3IDEuODg2aC4xeiIgZGF0YS1uYW1lPSJQYXRoIDIxNjkwIiB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMTc0Ni4yMDEgLTgxMjcpIi8+CiAgICAgICAgPHBhdGggaWQ9InByZWZpeF9fUGF0aF8yMTY5MSIgZmlsbD0iIzU5MWFjMSIgZD0iTTE3NzcuMTI2IDgxODYuNDgxYTcuODQzIDcuODQzIDAgMCAwLTcuODQ1LTcuODIybC0zLjY1NC4wMDYtNy43MTQuMDEyYTcuODIyIDcuODIyIDAgMCAwLS4yMSAxLjh2Ny45NjVhNy44NDEgNy44NDEgMCAwIDAgNy44MzMgNy44MzNoMTEuNTczdi0xLjEyMWMuMDItLjIzLjAzMS0uNDY1LjAzMS0uN3oiIGRhdGEtbmFtZT0iUGF0aCAyMTY5MSIgdHJhbnNmb3JtPSJ0cmFuc2xhdGUoLTE3NDYuMjAxIC04MTcyLjYzOSkiLz4KICAgIDwvZz4KPC9zdmc+Cg==",
  }

  public static getDefaultAvatar(fileName: string) {
    return this.defaultAvatar[fileName];
  }
  static DEFAULT_AVATAR_LENGTH = 27

}
