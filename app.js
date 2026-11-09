(() => {
  const pageKey = `studio-qc-${location.pathname}`;
  const itemsKey = `${pageKey}-custom-items-v1`;
  let boxes = [];
  let editMode = false;

  const lists = [...document.querySelectorAll('.checklist')];
  const defaults = lists.map(list => (list.dataset.items || '').split('|').map(s => s.trim()).filter(Boolean));
  let groups = loadGroups();

  function loadGroups() {
    try {
      const saved = JSON.parse(localStorage.getItem(itemsKey) || 'null');
      if (Array.isArray(saved) && saved.length === defaults.length) return saved;
    } catch (_) {}
    return defaults.map(items => [...items]);
  }

  function saveGroups() {
    localStorage.setItem(itemsKey, JSON.stringify(groups));
  }

  function savedChecks() {
    try { return JSON.parse(localStorage.getItem(pageKey) || '{}'); }
    catch (_) { return {}; }
  }

  function render() {
    const checked = savedChecks();
    lists.forEach((list, groupIndex) => {
      list.innerHTML = '';
      (groups[groupIndex] || []).forEach((text, itemIndex) => {
        const id = `${groupIndex}-${itemIndex}`;
        const row = document.createElement('div');
        row.className = 'check-row';

        const label = document.createElement('label');
        label.className = 'check';
        const input = document.createElement('input');
        input.type = 'checkbox';
        input.dataset.id = id;
        input.checked = !!checked[id];
        const span = document.createElement('span');
        span.textContent = text;
        label.append(input, span);
        row.appendChild(label);

        const controls = document.createElement('div');
        controls.className = 'item-controls';
        controls.innerHTML = `<button type="button" class="icon-btn edit-item" aria-label="編輯項目">編輯</button><button type="button" class="icon-btn danger delete-item" aria-label="刪除項目">刪除</button>`;
        controls.querySelector('.edit-item').addEventListener('click', () => editItem(groupIndex, itemIndex));
        controls.querySelector('.delete-item').addEventListener('click', () => deleteItem(groupIndex, itemIndex));
        row.appendChild(controls);
        list.appendChild(row);
      });

      const add = document.createElement('button');
      add.type = 'button';
      add.className = 'add-item';
      add.textContent = '＋ 新增檢查項目';
      add.addEventListener('click', () => addItem(groupIndex));
      list.appendChild(add);
    });

    boxes = [...document.querySelectorAll('.check input')];
    boxes.forEach(box => box.addEventListener('change', saveChecks));
    document.body.classList.toggle('editing', editMode);
    updateProgress();
  }

  function addItem(groupIndex) {
    const text = prompt('輸入新的檢查項目：');
    if (!text || !text.trim()) return;
    groups[groupIndex].push(text.trim());
    saveGroups();
    render();
  }

  function editItem(groupIndex, itemIndex) {
    const text = prompt('編輯檢查項目：', groups[groupIndex][itemIndex]);
    if (!text || !text.trim()) return;
    groups[groupIndex][itemIndex] = text.trim();
    saveGroups();
    render();
  }

  function deleteItem(groupIndex, itemIndex) {
    if (!confirm(`確定刪除「${groups[groupIndex][itemIndex]}」？`)) return;
    groups[groupIndex].splice(itemIndex, 1);
    saveGroups();
    localStorage.removeItem(pageKey);
    render();
  }

  function saveChecks() {
    const state = {};
    boxes.forEach(box => { state[box.dataset.id] = box.checked; });
    localStorage.setItem(pageKey, JSON.stringify(state));
    updateProgress();
  }

  function updateProgress() {
    const done = boxes.filter(box => box.checked).length;
    const bar = document.getElementById('progress');
    const text = document.getElementById('progressText');
    if (bar) bar.style.width = `${boxes.length ? done / boxes.length * 100 : 0}%`;
    if (text) text.textContent = `${done} / ${boxes.length}`;
  }

  window.resetChecks = () => {
    if (!confirm('確定要清除本頁所有勾選紀錄？')) return;
    boxes.forEach(box => { box.checked = false; });
    saveChecks();
  };

  function addEditButton() {
    const topbar = document.querySelector('.topbar-inner');
    if (!topbar || !lists.length) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn edit-toggle';
    button.textContent = '編輯項目';
    button.addEventListener('click', () => {
      editMode = !editMode;
      button.textContent = editMode ? '完成編輯' : '編輯項目';
      document.body.classList.toggle('editing', editMode);
    });
    topbar.appendChild(button);

    const note = document.createElement('div');
    note.className = 'edit-note';
    note.innerHTML = '<b>可自訂本頁項目</b><span>按「編輯項目」即可新增、修改或刪除。變更只保存在目前這台裝置與瀏覽器。</span><button type="button" class="restore-defaults">恢復預設項目</button>';
    note.querySelector('.restore-defaults').addEventListener('click', () => {
      if (!confirm('確定恢復本頁預設項目？自訂內容會被清除。')) return;
      groups = defaults.map(items => [...items]);
      localStorage.removeItem(itemsKey);
      localStorage.removeItem(pageKey);
      render();
    });
    const main = document.querySelector('main');
    if (main) main.insertBefore(note, main.firstChild);
  }

  addEditButton();
  render();
})();
