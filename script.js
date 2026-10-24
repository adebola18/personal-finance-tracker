(function () {
  var KEY = "ledger-tx-v1";
  var tx = [];
  var type = "out";

  // Load saved transactions from the browser
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) tx = JSON.parse(saved) || [];
  } catch (e) {}

  var $ = function (id) { return document.getElementById(id); };

  $("date").value = new Date().toISOString().slice(0, 10);

  try {
    var cur = localStorage.getItem("ledger-cur");
    if (cur) $("cur").value = cur;
  } catch (e) {}

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(tx)); } catch (e) {}
  }

  function money(n) {
    return $("cur").value + Number(n).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  // Switch between Expense and Income
  function setType(t) {
    type = t;
    $("tOut").setAttribute("aria-pressed", t === "out");
    $("tIn").setAttribute("aria-pressed", t === "in");
    $("catWrap").style.display = t === "out" ? "" : "none";
  }
  $("tOut").onclick = function () { setType("out"); };
  $("tIn").onclick = function () { setType("in"); };

  $("cur").oninput = function () {
    try { localStorage.setItem("ledger-cur", $("cur").value); } catch (e) {}
    render();
  };

  // Add a transaction
  $("f").onsubmit = function (e) {
    e.preventDefault();
    var amount = parseFloat($("amt").value);
    if (!(amount > 0)) return;
    tx.push({
      id: Date.now(),
      type: type,
      desc: $("desc").value.trim(),
      amt: amount,
      date: $("date").value,
      cat: type === "out" ? $("cat").value : "Income"
    });
    save();
    $("desc").value = "";
    $("amt").value = "";
    render();
    $("desc").focus();
  };

  // Redraw the whole page from the transaction list
  function render() {
    var income = 0, spent = 0, byCat = {};
    tx.forEach(function (t) {
      if (t.type === "in") {
        income += t.amt;
      } else {
        spent += t.amt;
        byCat[t.cat] = (byCat[t.cat] || 0) + t.amt;
      }
    });

    var balance = income - spent;
    $("balance").textContent = (balance < 0 ? "−" : "") + money(Math.abs(balance));
    $("totIn").textContent = "Income " + money(income);
    $("totOut").textContent = "Spent " + money(spent);

    var total = income + spent || 1;
    $("barIn").style.width = (income / total * 100) + "%";
    $("barOut").style.width = (spent / total * 100) + "%";

    // Spending by category
    var cats = $("cats");
    cats.textContent = "";
    var keys = Object.keys(byCat).sort(function (a, b) { return byCat[b] - byCat[a]; });
    if (!keys.length) {
      var p = document.createElement("p");
      p.className = "empty";
      p.textContent = "Add an expense to see where your money goes.";
      cats.appendChild(p);
    }
    keys.forEach(function (k) {
      var row = document.createElement("div");
      row.className = "row";
      var name = document.createElement("span");
      name.textContent = k;
      var bar = document.createElement("div");
      bar.className = "bar";
      var fill = document.createElement("i");
      fill.style.width = (byCat[k] / spent * 100) + "%";
      bar.appendChild(fill);
      var value = document.createElement("span");
      value.textContent = money(byCat[k]);
      row.append(name, bar, value);
      cats.appendChild(row);
    });

    // Transaction list, newest first
    var list = $("list");
    list.textContent = "";
    if (!tx.length) {
      var empty = document.createElement("li");
      empty.className = "empty";
      empty.style.display = "block";
      empty.textContent = "No transactions yet. Add your first one above.";
      list.appendChild(empty);
    }
    tx.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.id - a.id;
    }).forEach(function (t) {
      var li = document.createElement("li");
      var info = document.createElement("div");
      info.textContent = t.desc;
      var small = document.createElement("small");
      small.textContent = t.date + " · " + t.cat;
      info.appendChild(small);
      var amt = document.createElement("span");
      amt.className = "amt " + t.type;
      amt.textContent = (t.type === "in" ? "+" : "−") + money(t.amt);
      var del = document.createElement("button");
      del.className = "del";
      del.textContent = "Delete";
      del.setAttribute("aria-label", "Delete " + t.desc);
      del.onclick = function () {
        tx = tx.filter(function (z) { return z.id !== t.id; });
        save();
        render();
      };
      li.append(info, amt, del);
      list.appendChild(li);
    });
  }

  render();
})();