document.addEventListener('DOMContentLoaded', function() {
    // ========================================
    // STATE & KONFIGURASI
    // ========================================
    const STORAGE_KEY = 'bukuKasSederhana';

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    let transactions = [];

    // DOM Elements
    const tableBody = document.getElementById('tableBody');
    const addBtn = document.getElementById('addTransactionBtn');
    const clearBtn = document.getElementById('clearAllBtn');
    const generateBtn = document.getElementById('generatePDFBtn');
    const totalIncomeEl = document.getElementById('totalIncome');
    const totalExpenseEl = document.getElementById('totalExpense');
    const totalBalanceEl = document.getElementById('totalBalance');
    const errorMessages = document.getElementById('errorMessages');
    const successMessage = document.getElementById('successMessage');
    const filterMonth = document.getElementById('filterMonth');
    const filterYear = document.getElementById('filterYear');
    const inputDate = document.getElementById('inputDate');
    const inputType = document.getElementById('inputType');
    const inputDesc = document.getElementById('inputDesc');
    const inputAmount = document.getElementById('inputAmount');

    // ========================================
    // UTILITY FUNCTIONS
    // ========================================
    function isMobile() {
        return /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;
    }

    function formatRupiah(amount) {
        if (!amount && amount !== 0) return '';
        const num = parseInt(amount.toString().replace(/[^0-9]/g, ''));
        if (isNaN(num) || num === 0) return '';
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    }

    function parseRupiah(str) {
        if (!str) return 0;
        const num = parseInt(str.replace(/[^0-9]/g, ''));
        return isNaN(num) ? 0 : num;
    }

    function formatRupiahFull(amount) {
        const num = parseInt(amount) || 0;
        return 'Rp' + (formatRupiah(num.toString()) || '0');
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month.slice(0, 3)} ${year}`;
    }

    function formatDateFull(dateStr) {
        if (!dateStr) return '-';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        const day = String(d.getDate()).padStart(2, '0');
        const month = months[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    }

    function getMonthFromDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return months[d.getMonth()];
    }

    function getYearFromDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return '';
        return String(d.getFullYear());
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ========================================
    // LOCALSTORAGE
    // ========================================
    function saveToStorage() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
        } catch (e) {
            console.error('Gagal menyimpan ke localStorage:', e);
        }
    }

    function loadFromStorage() {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed)) {
                    transactions = parsed;
                }
            }
        } catch (e) {
            console.error('Gagal memuat dari localStorage:', e);
            transactions = [];
        }
    }

    // ========================================
    // INIT FILTER BULAN
    // ========================================
    function initFilterMonths() {
        months.forEach(m => {
            const opt = document.createElement('option');
            opt.value = m;
            opt.textContent = m;
            filterMonth.appendChild(opt);
        });
    }

    function setTodayDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        inputDate.value = `${yyyy}-${mm}-${dd}`;
        if (!filterYear.value) {
            filterYear.value = yyyy;
        }
    }

    // ========================================
    // RENDER TABEL
    // ========================================
    function getFilteredTransactions() {
        const fm = filterMonth.value;
        const fy = filterYear.value.trim();
        return transactions.filter(t => {
            if (fy && getYearFromDate(t.date) !== fy) return false;
            if (fm && getMonthFromDate(t.date) !== fm) return false;
            return true;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));
    }

    function renderTable() {
        const filtered = getFilteredTransactions();

        if (filtered.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="empty-state">Belum ada transaksi. Tambahkan transaksi baru di atas.</td></tr>`;
            return;
        }

        tableBody.innerHTML = '';
        filtered.forEach((t, idx) => {
            const tr = document.createElement('tr');
            tr.dataset.id = t.id;

            const tdNo = document.createElement('td');
            tdNo.textContent = idx + 1;
            tr.appendChild(tdNo);

            const tdDate = document.createElement('td');
            tdDate.className = 'col-date';
            tdDate.textContent = formatDate(t.date);
            tr.appendChild(tdDate);

            const tdDesc = document.createElement('td');
            tdDesc.className = 'col-desc';
            tdDesc.textContent = t.description;
            tr.appendChild(tdDesc);

            const tdIncome = document.createElement('td');
            tdIncome.className = 'col-income';
            tdIncome.textContent = t.type === 'income' ? formatRupiahFull(t.amount) : '-';
            tr.appendChild(tdIncome);

            const tdExpense = document.createElement('td');
            tdExpense.className = 'col-expense';
            tdExpense.textContent = t.type === 'expense' ? formatRupiahFull(t.amount) : '-';
            tr.appendChild(tdExpense);

            const tdAction = document.createElement('td');
            const deleteBtn = document.createElement('button');
            deleteBtn.type = 'button';
            deleteBtn.className = 'btn btn-delete';
            deleteBtn.textContent = '✕';
            deleteBtn.title = 'Hapus';
            deleteBtn.setAttribute('aria-label', 'Hapus transaksi');
            deleteBtn.addEventListener('click', function() {
                deleteTransaction(t.id);
            });
            tdAction.appendChild(deleteBtn);
            tr.appendChild(tdAction);

            tableBody.appendChild(tr);
        });
    }

    // ========================================
    // UPDATE RINGKASAN
    // ========================================
    function updateSummary() {
        const filtered = getFilteredTransactions();
        let income = 0;
        let expense = 0;

        filtered.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else if (t.type === 'expense') expense += t.amount;
        });

        const balance = income - expense;

        totalIncomeEl.textContent = formatRupiahFull(income);
        totalExpenseEl.textContent = formatRupiahFull(expense);
        totalBalanceEl.textContent = formatRupiahFull(balance);

        if (balance < 0) {
            totalBalanceEl.classList.add('negative');
        } else {
            totalBalanceEl.classList.remove('negative');
        }
    }

    // ========================================
    // TAMBAH TRANSAKSI
    // ========================================
    function addTransaction() {
        const date = inputDate.value.trim();
        const type = inputType.value;
        const description = inputDesc.value.trim();
        const amount = parseRupiah(inputAmount.value);

        const errors = [];

        if (!date) {
            inputDate.classList.add('error');
            errors.push('Tanggal wajib diisi');
        } else {
            inputDate.classList.remove('error');
        }

        if (!description) {
            inputDesc.classList.add('error');
            errors.push('Keterangan wajib diisi');
        } else {
            inputDesc.classList.remove('error');
        }

        if (amount <= 0) {
            inputAmount.classList.add('error');
            errors.push('Jumlah harus lebih dari 0');
        } else {
            inputAmount.classList.remove('error');
        }

        if (errors.length > 0) {
            showError(errors);
            return;
        }

        const newTx = {
            id: Date.now() + Math.random().toString(36).substr(2, 9),
            date: date,
            type: type,
            description: description,
            amount: amount
        };

        transactions.push(newTx);
        saveToStorage();
        renderTable();
        updateSummary();

        inputDesc.value = '';
        inputAmount.value = '';
        inputDesc.focus();

        showSuccess('Transaksi berhasil ditambahkan!');
    }

    // ========================================
    // HAPUS TRANSAKSI
    // ========================================
    function deleteTransaction(id) {
        if (!confirm('Yakin ingin menghapus transaksi ini?')) return;
        transactions = transactions.filter(t => t.id !== id);
        saveToStorage();
        renderTable();
        updateSummary();
        showSuccess('Transaksi dihapus.');
    }

    // ========================================
    // HAPUS SEMUA
    // ========================================
    function clearAll() {
        if (transactions.length === 0) {
            showError('Belum ada transaksi untuk dihapus.');
            return;
        }
        if (!confirm('Yakin ingin menghapus SEMUA transaksi? Tindakan ini tidak bisa dibatalkan.')) return;
        transactions = [];
        saveToStorage();
        renderTable();
        updateSummary();
        showSuccess('Semua transaksi dihapus.');
    }

    // ========================================
    // MESSAGES
    // ========================================
    function showError(message) {
        if (typeof message === 'string') {
            errorMessages.innerHTML = `<ul><li>${escapeHtml(message)}</li></ul>`;
        } else if (Array.isArray(message)) {
            errorMessages.innerHTML = '<ul>' + message.map(m => `<li>${escapeHtml(m)}</li>`).join('') + '</ul>';
        }
        errorMessages.style.display = 'block';
        successMessage.style.display = 'none';
        clearTimeout(window.errorTimeout);
        window.errorTimeout = setTimeout(() => {
            errorMessages.style.display = 'none';
        }, 6000);
    }

    function showSuccess(message) {
        successMessage.textContent = message || 'Berhasil!';
        successMessage.style.display = 'block';
        errorMessages.style.display = 'none';
        clearTimeout(window.successTimeout);
        window.successTimeout = setTimeout(() => {
            successMessage.style.display = 'none';
        }, 4000);
    }

    // ========================================
    // GENERATE PDF
    // ========================================
    async function generatePDF() {
        const filtered = getFilteredTransactions();

        if (filtered.length === 0) {
            showError('Tidak ada transaksi untuk di-generate ke PDF.');
            return;
        }

        generateBtn.disabled = true;
        generateBtn.classList.add('loading');
        generateBtn.textContent = 'Memproses...';

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            let totalIncome = 0;
            let totalExpense = 0;
            filtered.forEach(t => {
                if (t.type === 'income') totalIncome += t.amount;
                else totalExpense += t.amount;
            });
            const balance = totalIncome - totalExpense;

            const fm = filterMonth.value;
            const fy = filterYear.value.trim();
            const periode = (fm ? fm + ' ' : '') + (fy || 'Semua');

            doc.setFont('times', 'bold');
            doc.setFontSize(22);
            doc.setTextColor(26, 26, 46);
            doc.text('BUKU KAS', pageWidth / 2, 28, { align: 'center' });

            doc.setFont('times', 'normal');
            doc.setFontSize(13);
            doc.setTextColor(107, 114, 128);
            doc.text(`Periode: ${periode}`, pageWidth / 2, 40, { align: 'center' });

            doc.setDrawColor(229, 231, 235);
            doc.setLineWidth(0.5);
            doc.line(20, 48, pageWidth - 20, 48);

            const tableData = filtered.map((t, idx) => [
                idx + 1,
                formatDateFull(t.date),
                t.description,
                t.type === 'income' ? formatRupiahFull(t.amount) : '-',
                t.type === 'expense' ? formatRupiahFull(t.amount) : '-'
            ]);

            doc.autoTable({
                startY: 56,
                head: [[
                    { content: 'NO', styles: { halign: 'center', valign: 'middle', font: 'times', fontStyle: 'bold' } },
                    { content: 'Tanggal', styles: { halign: 'center', valign: 'middle', font: 'times', fontStyle: 'bold' } },
                    { content: 'Keterangan', styles: { halign: 'left', valign: 'middle', font: 'times', fontStyle: 'bold' } },
                    { content: 'Pemasukan', styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold' } },
                    { content: 'Pengeluaran', styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold' } }
                ]],
                body: tableData,
                foot: [
                    [
                        { content: 'TOTAL PEMASUKAN', colSpan: 3, styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold', fillColor: [229, 231, 235], textColor: [15, 118, 110] } },
                        { content: formatRupiahFull(totalIncome), colSpan: 2, styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold', fillColor: [229, 231, 235], textColor: [15, 118, 110] } }
                    ],
                    [
                        { content: 'TOTAL PENGELUARAN', colSpan: 3, styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold', fillColor: [229, 231, 235], textColor: [190, 18, 60] } },
                        { content: formatRupiahFull(totalExpense), colSpan: 2, styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold', fillColor: [229, 231, 235], textColor: [190, 18, 60] } }
                    ],
                    [
                        { content: 'SALDO AKHIR', colSpan: 3, styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold', fontSize: 12, fillColor: [254, 243, 199], textColor: [54, 69, 79] } },
                        { content: formatRupiahFull(balance), colSpan: 2, styles: { halign: 'right', valign: 'middle', font: 'times', fontStyle: 'bold', fontSize: 13, fillColor: [254, 243, 199], textColor: [54, 69, 79] } }
                    ]
                ],
                theme: 'striped',
                headStyles: {
                    font: 'times',
                    fillColor: [54, 69, 79],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    fontSize: 10,
                    halign: 'center',
                    valign: 'middle',
                    cellPadding: { top: 5, right: 3, bottom: 5, left: 3 },
                    minCellHeight: 12
                },
                bodyStyles: {
                    font: 'times',
                    fontSize: 10,
                    textColor: [26, 26, 46],
                    valign: 'middle'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 14, valign: 'middle' },
                    1: { halign: 'center', cellWidth: 32, valign: 'middle' },
                    2: { halign: 'left', cellWidth: 60, valign: 'middle' },
                    3: { halign: 'right', cellWidth: 34, valign: 'middle' },
                    4: { halign: 'right', cellWidth: 34, valign: 'middle' }
                },
                footStyles: {
                    font: 'times',
                    fillColor: [229, 231, 235],
                    textColor: [54, 69, 79],
                    valign: 'middle'
                },
                margin: { left: 18, right: 18 },
                tableWidth: pageWidth - 36,
                styles: {
                    font: 'times',
                    cellPadding: 4,
                    lineColor: [209, 213, 219],
                    lineWidth: 0.2,
                    valign: 'middle',
                    overflow: 'linebreak'
                },
                didDrawPage: function(data) {
                    const footerY = pageHeight - 15;
                    doc.setFont('times', 'italic');
                    doc.setFontSize(8);
                    doc.setTextColor(156, 163, 175);
                    doc.text(
                        `Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })} • ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`,
                        pageWidth / 2,
                        footerY,
                        { align: 'center' }
                    );
                }
            });

            const filename = `Buku_Kas_${(fm || 'SemuaBulan').replace(/\s/g, '')}_${fy || 'SemuaTahun'}.pdf`;
            doc.save(filename);
            showSuccess('PDF berhasil diunduh!');

        } catch (error) {
            console.error('Error:', error);
            showError('Gagal generate PDF: ' + error.message);
        } finally {
            generateBtn.disabled = false;
            generateBtn.classList.remove('loading');
            generateBtn.textContent = 'Generate PDF';
        }
    }

    // ========================================
    // PWA - INSTALL PROMPT (Android & Windows)
    // ========================================
    let deferredPrompt;

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        const installBtn = document.getElementById('installBtn');
        if (installBtn) {
            installBtn.style.display = 'inline-flex';
        }
    });

    const installBtn = document.getElementById('installBtn');
    if (installBtn) {
        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            
            if (outcome === 'accepted') {
                showSuccess('Aplikasi berhasil di-install!');
            }
            
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    window.addEventListener('appinstalled', () => {
        const btn = document.getElementById('installBtn');
        if (btn) btn.style.display = 'none';
        showSuccess('Aplikasi sudah terinstall di perangkat!');
    });

    // Daftarkan Service Worker
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then((reg) => console.log('✅ Service Worker aktif:', reg.scope))
                .catch((err) => console.warn('⚠️ Service Worker gagal:', err));
        });
    }

    // ========================================
    // EVENT LISTENERS
    // ========================================
    addBtn.addEventListener('click', function(e) {
        e.preventDefault();
        addTransaction();
    });

    clearBtn.addEventListener('click', function(e) {
        e.preventDefault();
        clearAll();
    });

    generateBtn.addEventListener('click', function(e) {
        e.preventDefault();
        generatePDF();
    });

    filterMonth.addEventListener('change', function() {
        renderTable();
        updateSummary();
    });

    filterYear.addEventListener('change', function() {
        renderTable();
        updateSummary();
    });

    filterYear.addEventListener('input', function() {
        renderTable();
        updateSummary();
    });

    inputAmount.addEventListener('input', function() {
        const raw = this.value.replace(/[^0-9]/g, '');
        this.value = raw ? formatRupiah(raw) : '';
    });

    inputDesc.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            inputAmount.focus();
        }
    });

    inputAmount.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTransaction();
        }
    });

    document.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            generatePDF();
        }
    });

    if (isMobile()) {
        document.addEventListener('focusin', function(e) {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                setTimeout(() => {
                    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 350);
            }
        });
    }

    // ========================================
    // INIT
    // ========================================
    initFilterMonths();
    loadFromStorage();
    setTodayDate();
    renderTable();
    updateSummary();

    console.log('✅ Buku Kas siap digunakan!');
    console.log('💡 Tip: Ctrl+Enter untuk generate PDF | Data tersimpan otomatis di browser');
});