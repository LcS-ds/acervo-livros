(() => {
  'use strict';

  const TABLE = 'biblioteca_livros';
  const STORAGE_KEY = 'acervo_supabase_config_v1';
  const $ = (selector) => document.querySelector(selector);
  const el = {
    indicator: $('#connection-indicator'), setupPanel: $('#setup-panel'), setupForm: $('#setup-form'),
    projectUrl: $('#project-url'), publishableKey: $('#publishable-key'),
    newButton: $('#new-book-button'), refreshButton: $('#refresh-button'),
    search: $('#search-input'), filter: $('#status-filter'), feedback: $('#feedback'),
    list: $('#book-list'), empty: $('#empty-state'), emptyMessage: $('#empty-message'), count: $('#total-count'),
    dialog: $('#book-dialog'), form: $('#book-form'), dialogTitle: $('#dialog-title'),
    closeDialog: $('#close-dialog'), cancelDialog: $('#cancel-dialog'), formError: $('#form-error'),
    title: $('#book-title'), author: $('#book-author'), genre: $('#book-genre'), year: $('#book-year'),
    status: $('#book-status'), notes: $('#book-notes'), save: $('#save-book'),
    deleteDialog: $('#delete-dialog'), deleteName: $('#delete-book-name'), cancelDelete: $('#cancel-delete'), confirmDelete: $('#confirm-delete')
  };
  const labels = { 'quero-ler': 'Quero ler', 'lendo': 'Lendo', 'lido': 'Lido' };
  let config = null;
  let books = [];
  let editingId = null;
  let deletingId = null;

  function setConnection(text, state = '') {
    el.indicator.textContent = text;
    el.indicator.className = `connection-indicator ${state}`.trim();
  }

  function setFeedback(message = '') { el.feedback.textContent = message; }

  function readConfig() {
    const bundled = window.ACERVO_CONFIG || {};
    if (bundled.supabaseUrl && bundled.publishableKey) return bundled;
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'); }
    catch { return null; }
  }

  function hasValidConfig(value) {
    try {
      const url = new URL(value.supabaseUrl);
      return url.protocol === 'https:' && Boolean(url.hostname) && /^sb_publishable_[A-Za-z0-9_-]+$/.test(value.publishableKey);
    } catch { return false; }
  }

  async function api(method, query = '', body) {
    if (!config) throw new Error('Conecte seu projeto Supabase primeiro.');
    const response = await fetch(`${config.supabaseUrl.replace(/\/+$/, '')}/rest/v1/${TABLE}${query}`, {
      method,
      headers: {
        apikey: config.publishableKey,
        'Content-Type': 'application/json',
        Prefer: 'return=representation'
      },
      body: body === undefined ? undefined : JSON.stringify(body)
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      if (payload?.code === '23505') throw new Error('Este livro já está cadastrado com o mesmo título e autor.');
      if (payload?.code === '42501') throw new Error('A tabela não permite esta operação. Verifique as políticas e os GRANTs do SQL.');
      throw new Error(payload?.message || `Falha na conexão (HTTP ${response.status}).`);
    }
    return payload;
  }

  function make(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = String(text);
    return node;
  }

  function icon(kind) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('aria-hidden', 'true');
    const path = document.createElementNS(svg.namespaceURI, 'path');
    path.setAttribute('d', kind === 'edit' ? 'M15 4 20 9M4 20l5-1L21 7a3.5 3.5 0 0 0-5-5L4 14z' : 'M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7M14 10v7');
    svg.append(path);
    return svg;
  }

  function cover(book) {
    const palettes = [['#285545','#eee5bf'],['#b86649','#fff1cb'],['#d4b989','#3f4e35'],['#57727a','#eee6c6'],['#87875d','#fff0cb'],['#7e525a','#f5e8c9']];
    const hash = [...book.titulo].reduce((sum, letter) => sum + letter.codePointAt(0), 0);
    const palette = palettes[hash % palettes.length];
    const node = make('span', `book-cover cover-theme-${hash % 3}`);
    node.style.setProperty('--cover-bg', palette[0]);
    node.style.setProperty('--cover-fg', palette[1]);
    node.append(make('span', 'cover-label', 'BIBLIOTECA ACERVO'), make('span', 'cover-title', book.titulo), make('span', 'cover-motif'), make('span', 'cover-author', book.autor));
    return node;
  }

  function openDetail(book) {
    $('#detail-title').textContent = book.titulo;
    $('#detail-author').textContent = book.autor;
    $('#detail-notes').textContent = book.descricao || 'Ainda não há notas para este livro.';
    $('#detail-cover').replaceChildren(cover(book));
    $('#detail-meta').replaceChildren(make('span', `status status-${book.situacao}`, labels[book.situacao]), make('span', '', [book.genero, book.ano_publicacao].filter(Boolean).join(' · ')));
    $('#detail-edit').onclick = () => { $('#detail-dialog').close(); openEdit(book); };
    $('#detail-dialog').showModal();
  }

  function bookRow(book) {
    const row = make('article', 'book-card');
    const stage = make('div', 'cover-stage');
    const view = make('button', 'cover-button');
    view.type = 'button';
    view.setAttribute('aria-label', `Ver detalhes de ${book.titulo}`);
    view.append(cover(book));
    view.addEventListener('click', () => openDetail(book));
    stage.append(make('span', `status status-${book.situacao}`, labels[book.situacao]), view);
    const info = make('div', 'book-info');
    info.append(make('p', 'book-genre', book.genero || 'Literatura'), make('h3', 'book-title', book.titulo), make('p', 'book-author', book.autor));
    const bottom = make('div', 'card-bottom');
    bottom.append(make('span', 'year', book.ano_publicacao ? `PUBLICADO EM ${book.ano_publicacao}` : 'ANO NÃO INFORMADO'));
    const actions = make('div', 'row-actions');
    const edit = make('button', 'icon-button');
    edit.append(icon('edit'));
    edit.type = 'button'; edit.title = 'Editar livro'; edit.setAttribute('aria-label', `Editar ${book.titulo}`);
    edit.addEventListener('click', () => openEdit(book));
    const remove = make('button', 'icon-button delete');
    remove.append(icon('delete'));
    remove.type = 'button'; remove.title = 'Excluir livro'; remove.setAttribute('aria-label', `Excluir ${book.titulo}`);
    remove.addEventListener('click', () => openDelete(book));
    actions.append(edit, remove);
    bottom.append(actions);
    info.append(bottom);
    row.append(stage, info);
    return row;
  }

  function render() {
    const term = el.search.value.trim().toLocaleLowerCase('pt-BR');
    const filter = el.filter.value;
    const visible = books.filter((book) => {
      const matchesTerm = `${book.titulo} ${book.autor}`.toLocaleLowerCase('pt-BR').includes(term);
      return matchesTerm && (filter === 'todos' || book.situacao === filter);
    });
    el.count.textContent = String(books.length);
    $('#stat-total').textContent = String(books.length).padStart(2, '0');
    $('#stat-reading').textContent = String(books.filter(book => book.situacao === 'lendo').length).padStart(2, '0');
    $('#stat-read').textContent = String(books.filter(book => book.situacao === 'lido').length).padStart(2, '0');
    $('#tab-total').textContent = String(books.length);
    $('#result-count').textContent = `${visible.length} ${visible.length === 1 ? 'livro nesta estante' : 'livros nesta estante'}`;
    el.list.replaceChildren(...visible.map(bookRow));
    el.empty.hidden = visible.length > 0 || !config;
    el.emptyMessage.textContent = books.length === 0
      ? 'Adicione o primeiro livro para começar o acervo.'
      : 'Tente outra busca ou selecione um status diferente.';
  }

  async function loadBooks() {
    if (!config) return;
    el.refreshButton.disabled = true;
    setFeedback('Carregando livros...');
    try {
      const data = await api('GET', '?select=id,titulo,autor,genero,ano_publicacao,situacao,descricao,criado_em&order=criado_em.desc&limit=1000');
      books = Array.isArray(data) ? data : [];
      setConnection('Conectado ao Supabase', 'connected');
      el.setupPanel.hidden = true;
      setFeedback('');
      render();
      return true;
    } catch (error) {
      setConnection('Falha na conexão', 'error');
      setFeedback(error.message);
      if (!window.ACERVO_CONFIG?.supabaseUrl) el.setupPanel.hidden = false;
      return false;
    } finally { el.refreshButton.disabled = false; }
  }

  function openNew() {
    if (!config) { el.setupPanel.scrollIntoView({ behavior: 'smooth' }); return; }
    editingId = null;
    el.form.reset();
    el.formError.textContent = '';
    el.dialogTitle.textContent = 'Novo livro';
    el.save.textContent = 'Salvar livro';
    el.dialog.showModal();
    el.title.focus();
  }

  function openEdit(book) {
    editingId = book.id;
    el.formError.textContent = '';
    el.dialogTitle.textContent = 'Editar livro';
    el.save.textContent = 'Salvar alterações';
    el.title.value = book.titulo;
    el.author.value = book.autor;
    el.genre.value = book.genero || '';
    el.year.value = book.ano_publicacao || '';
    el.status.value = book.situacao;
    el.notes.value = book.descricao || '';
    el.dialog.showModal();
    el.title.focus();
  }

  async function saveBook(event) {
    event.preventDefault();
    if (!el.form.reportValidity()) return;
    const record = {
      titulo: el.title.value.trim(), autor: el.author.value.trim(),
      genero: el.genre.value.trim() || null,
      ano_publicacao: el.year.value ? Number(el.year.value) : null,
      situacao: el.status.value,
      descricao: el.notes.value.trim() || null
    };
    if (!record.titulo || !record.autor) { el.formError.textContent = 'Título e autor são obrigatórios.'; return; }
    el.save.disabled = true;
    el.formError.textContent = '';
    try {
      if (editingId) {
        const updated = await api('PATCH', `?id=eq.${encodeURIComponent(editingId)}`, record);
        if (!updated?.length) throw new Error('Este livro já foi removido. Atualize a lista para continuar.');
      }
      else await api('POST', '', record);
      el.dialog.close();
      const refreshed = await loadBooks();
      if (refreshed) setFeedback(editingId ? 'Livro atualizado com sucesso.' : 'Livro adicionado com sucesso.');
    } catch (error) { el.formError.textContent = error.message; }
    finally { el.save.disabled = false; }
  }

  function openDelete(book) {
    deletingId = book.id;
    el.deleteName.textContent = `${book.titulo} — ${book.autor}`;
    el.deleteDialog.showModal();
  }

  async function deleteBook() {
    if (!deletingId) return;
    el.confirmDelete.disabled = true;
    try {
      await api('DELETE', `?id=eq.${encodeURIComponent(deletingId)}`);
      el.deleteDialog.close();
      deletingId = null;
      if (await loadBooks()) setFeedback('Livro excluído com sucesso.');
    } catch (error) { setFeedback(error.message); el.deleteDialog.close(); }
    finally { el.confirmDelete.disabled = false; }
  }

  el.newButton.addEventListener('click', openNew);
  el.refreshButton.addEventListener('click', loadBooks);
  el.search.addEventListener('input', render);
  el.filter.addEventListener('change', render);
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    el.filter.value = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(tab => {
      const active = tab === button;
      tab.classList.toggle('active', active);
      tab.setAttribute('aria-pressed', String(active));
    });
    render();
  }));
  $('#close-detail').addEventListener('click', () => $('#detail-dialog').close());
  el.closeDialog.addEventListener('click', () => el.dialog.close());
  el.cancelDialog.addEventListener('click', () => el.dialog.close());
  el.form.addEventListener('submit', saveBook);
  el.cancelDelete.addEventListener('click', () => el.deleteDialog.close());
  el.confirmDelete.addEventListener('click', deleteBook);
  el.setupForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const candidate = { supabaseUrl: el.projectUrl.value.trim(), publishableKey: el.publishableKey.value.trim() };
    if (!hasValidConfig(candidate)) { setFeedback('Use uma URL HTTPS e uma chave pública sb_publishable_.'); return; }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(candidate));
    config = candidate;
    setFeedback('');
    loadBooks();
  });

  config = readConfig();
  if (config && hasValidConfig(config)) loadBooks();
  else { config = null; el.setupPanel.hidden = false; setConnection('Aguardando conexão'); render(); }
})();
