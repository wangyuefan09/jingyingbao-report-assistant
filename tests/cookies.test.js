const assert = require("node:assert/strict");

const { cookiesToHeader } = require("../src/lib/cookies");

module.exports = [
  {
    name: "cookiesToHeader joins cookie pairs in order",
    fn() {
      const header = cookiesToHeader([
        { name: "foo", value: "bar" },
        { name: "hello", value: "world" },
      ]);

      assert.equal(header, "foo=bar; hello=world");
    },
  },
  {
    name: "cookiesToHeader skips entries without a cookie name",
    fn() {
      const header = cookiesToHeader([
        { name: "foo", value: "bar" },
        { value: "missing-name" },
        { name: "", value: "blank-name" },
      ]);

      assert.equal(header, "foo=bar");
    },
  },
];
