import { BaseView } from './base.view.js';
import { dataService } from '../services/data.service.js';
import { formatters, toast } from '../utils/ui.js';

export class BillingView extends BaseView {
  // Helper function to translate status to French
  getStatusLabel(status) {
    const statusMap = {
      PENDING: 'En attente',
      IN_TRANSIT: 'En transit',
      OUT_FOR_DELIVERY: 'En cours de livraison',
      DELIVERED: 'Livré',
      CANCELLED: 'Annulé',
      RETURNED: 'Retourné',
      PAID: 'Payé',
      OVERDUE: 'En retard',
    };
    return statusMap[status] || status; // Return original if not found
  }

  // Helper function to get CSS class for status badge
  getStatusBadgeClass(status) {
    const statusClasses = {
      PENDING: 'badge-en-attente',
      IN_TRANSIT: 'badge-en-transit',
      OUT_FOR_DELIVERY: 'badge-en-cours-livraison',
      DELIVERED: 'badge-livre',
      CANCELLED: 'badge-annule',
      RETURNED: 'badge-annule', // Using same as cancelled for return
      PAID: 'badge-success', // Using existing class
      OVERDUE: 'badge-warning', // Using existing class
    };
    return statusClasses[status] || 'badge-info'; // Default to info if not found
  }

  async render() {
    // Fetch stats parallel to rendering layout to save time in real app, but here we wait to populate
    let stats = { totalInvoices: 0, pendingInvoices: 0, paidInvoices: 0, totalRevenue: 0 };
    try {
      const res = await dataService.getInvoiceStats();
      if (res) stats = res;
    } catch (e) {
      console.error('Stats error', e);
    }

    const layout = this.renderLayout(
      `
            <div class="page-header">
                <h2>Facturation & Tarifs</h2>
                <button class="btn btn-primary" id="btn-new-invoice"><i class="fa-solid fa-plus"></i> Nouvelle Facture</button>
            </div>

            <!-- Stats Cards -->
            <div class="stats-grid" style="grid-template-columns: repeat(4, 1fr); margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="icon" style="background: rgba(99, 102, 241, 0.2); color: #6366f1;"><i class="fa-solid fa-file-invoice-dollar"></i></div>
                    <div class="info">
                        <h3>${stats.totalInvoices || 0}</h3>
                        <p>Total Factures</p>
                    </div>
                </div>
                <div class="stat-card">
                    <div class="icon" style="background: rgba(236, 72, 153, 0.2); color: #ec4899;"><i class="fa-solid fa-clock"></i></div>
                    <div class="info">
                        <h3>${stats.pendingInvoices || 0}</h3>
                        <p>En Attente</p>
                    </div>
                </div>
                 <div class="stat-card">
                    <div class="icon" style="background: rgba(34, 197, 94, 0.2); color: #22c55e;"><i class="fa-solid fa-check-circle"></i></div>
                    <div class="info">
                        <h3>${stats.paidInvoices || 0}</h3>
                        <p>Payées</p>
                    </div>
                </div>
                 <div class="stat-card">
                    <div class="icon" style="background: rgba(234, 179, 8, 0.2); color: #eab308;"><i class="fa-solid fa-coins"></i></div>
                    <div class="info">
                        <h3>${formatters.currency(stats.totalRevenue || 0)}</h3>
                        <p>Revenu Total</p>
                    </div>
                </div>
            </div>

            <div class="glass-panel">
                    <h3>Dernières Factures</h3>
                    <div class="invoices-container">
                        <div class="table-responsive">
                            <table class="table desktop-table">
                                <thead>
                                    <tr>
                                        <th>N° Facture</th>
                                        <th>Client</th>
                                        <th>Montant</th>
                                        <th>Statut</th>
                                        <th>Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody id="invoices-table">
                                    <tr><td colspan="6" style="text-align:center">Chargement...</td></tr>
                                </tbody>
                            </table>
                        </div>

                        <div id="invoices-cards-list" class="invoices-cards-container" style="display: none;">
                            <div id="invoices-cards">
                                <div class="table-empty-state" id="invoices-loading">
                                    Chargement...
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Pagination Controls -->
                    <div class="pagination-controls" style="display:flex; justify-content:space-between; align-items:center; margin-top:1rem;">
                        <div id="invoice-pagination-info" style="color:var(--text-light); font-size:0.9em;">
                            Affichage de <span id="invoice-pagination-start">0</span> à <span id="invoice-pagination-end">0</span> sur <span id="invoice-pagination-total">0</span> factures
                        </div>
                        <div class="pagination-buttons">
                            <button id="prev-invoice-page" class="btn btn-outline" disabled>
                                <i class="fa-solid fa-chevron-left"></i> Précédent
                            </button>
                            <span id="current-invoice-page" style="margin:0 1rem; min-width:30px; display:inline-block; text-align:center;">1</span>
                            <button id="next-invoice-page" class="btn btn-outline" disabled>
                                Suivant <i class="fa-solid fa-chevron-right"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Tariff Rates Display - Prominent section showing per-kilogram rates -->
                <div id="tariff-rates-section" class="glass-panel" style="margin-top: 2rem; border: 2px solid rgba(99, 102, 241, 0.3);">
                    <h3 style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <span>Tarifs de Transport</span>
                        <span style="font-size: 0.9rem; color: var(--text-muted);">Prix par kilogramme</span>
                    </h3>
                    <div id="tariff-rates-display" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem;">
                        <div style="text-align: center; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="font-size: 1.8rem; font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">-</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">Chargement des tarifs...</div>
                        </div>
                    </div>
                </div>

                <!-- Tariffs Management Section - Only for Admins -->
                <div id="tariffs-section" class="glass-panel" style="margin-top: 2rem;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                        <h3>Tarifs Actuels</h3>
                        <button id="add-tariff-btn" class="btn btn-primary" style="display: flex; align-items: center; gap: 0.5rem;">
                            <i class="fa-solid fa-plus"></i> Ajouter Tarif
                        </button>
                    </div>
                    <div id="tariffs-list" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1rem;">
                        <div style="text-align: center; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid var(--border);">
                            <div style="font-size: 1.8rem; font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">-</div>
                            <div style="font-size: 0.9rem; color: var(--text-muted);">Chargement des tarifs...</div>
                        </div>
                    </div>
                </div>
            </div>

             <!-- New Invoice Modal -->
            <div id="invoice-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3>Créer une Facture</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="invoice-form">
                        <div class="form-group">
                            <label>Client</label>
                            <select id="clientId" required>
                                <option value="">Sélectionner un client...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Expédition (Optionnel)</label>
                            <select id="shipmentId" disabled>
                                <option value="">D'abord choisir un client...</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Montant (XAF)</label>
                            <input type="number" id="amount" required readonly style="background: rgba(0,0,0,0.1);">
                            <small id="amount-help" style="color: var(--text-muted); display: block; margin-top: 0.25rem;">Sélectionnez une expédition pour calculer automatiquement</small>
                        </div>
                        <div class="form-group">
                            <label>Date d'échéance</label>
                            <input type="date" id="dueDate" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-full">Créer</button>
                    </form>
                </div>
            </div>

        `,
      'billing',
    );

    this.root.innerHTML = layout;
    this.bindEvents();
    this.loadInvoices('', 1);

    // Add resize event listener to handle layout changes
    window.addEventListener('resize', () => {
      // Reload the current invoice list to adjust for new screen size
      this.loadInvoices(this.currentQuery, this.currentPage);
    });

    // Load tariff rates for all users to see the per-kilogram rates
    this.loadTariffRates();

    // Only show tariffs management to admins, not to secretaries
    if (this.state && (this.state.isAdmin || this.state.get('user')?.role === 'ADMIN')) {
      this.loadTariffs();
    } else {
      // Hide tariffs management section for non-admins
      const tariffsSection = document.getElementById('tariffs-section');
      if (tariffsSection) {
        tariffsSection.style.display = 'none';
      }
    }
  }

  currentPage = 1;
  totalPages = 1;
  itemsPerPage = 10;
  currentInvoiceQuery = '';

  bindEvents() {
    const modal = document.getElementById('invoice-modal');
    const btnNew = document.getElementById('btn-new-invoice');
    const btnClose = modal.querySelector('.modal-close');

    const clientSelect = document.getElementById('clientId');
    const shipmentSelect = document.getElementById('shipmentId');

    // Load clients when opening modal
    if (btnNew)
      btnNew.addEventListener('click', async () => {
        modal.style.display = 'flex';
        // Populate Clients
        try {
          const res = await dataService.getClients();
          const clients = res.data || res;
          clientSelect.innerHTML =
            '<option value="">Sélectionner un client...</option>' +
            clients.map((c) => `<option value="${c.id}">${c.name}</option>`).join('');
        } catch (e) {
          console.error('Error loading clients', e);
        }
      });

    if (btnClose) btnClose.addEventListener('click', () => (modal.style.display = 'none'));

    // Handle Client Change -> Load Shipments
    clientSelect.addEventListener('change', async (e) => {
      const clientId = e.target.value;
      shipmentSelect.innerHTML = '<option value="">Chargement...</option>';
      shipmentSelect.disabled = true;

      if (!clientId) {
        shipmentSelect.innerHTML = '<option value="">D\'abord choisir un client...</option>';
        return;
      }

      try {
        // Fetch shipments for this client
        const res = await dataService.getShipments(`clientId=${clientId}`, 1, 100); // Use 100 as limit for dropdown
        const shipments = res.data || res;

        if (shipments.length === 0) {
          shipmentSelect.innerHTML = '<option value="">Aucune expédition trouvée</option>';
        } else {
          shipmentSelect.innerHTML =
            '<option value="">Sélectionner une expédition (optionnel)</option>' +
            shipments
              .map((s) => `<option value="${s.id}">${s.trackingNumber} - ${s.status}</option>`)
              .join('');
          shipmentSelect.disabled = false;
        }
      } catch (err) {
        console.error(err);
        shipmentSelect.innerHTML = '<option value="">Erreur chargement</option>';
      }
    });

    // Handle Shipment Change -> Calculate Amount
    shipmentSelect.addEventListener('change', async (e) => {
      const shipmentId = e.target.value;
      const amountInput = document.getElementById('amount');

      if (!shipmentId) {
        amountInput.value = '';
        return;
      }

      try {
        // Get shipment details to calculate amount
        const shipment = await dataService.getShipment(shipmentId);
        console.log(shipment);
        const tarrif = await dataService.getTariffs();
        console.log(tarrif);
        let tar = tarrif.filter((t) => {
          console.log(t.origin);
          console.log(shipment.origin);
          return t.origin === shipment.origin;
        });
        console.log(tar);

        // Calculate amount based on weight and tariff rates
        // For now, use a simple calculation - in a real app, this would use actual tariff rules
        const weight = shipment.weight || 1; // Default to 1kg if no weight
        const baseRate = parseInt(tar[0].ratePerKg); // Default base rate
        // const ratePerKg = 2000; // Default rate per kg

        // Calculate: base rate + (weight - 1) * rate per kg
        const calculatedAmount = baseRate * weight;

        amountInput.value = calculatedAmount;
      } catch (err) {
        console.error('Error calculating amount:', err);
        amountInput.value = '';
      }
    });

    // Invoice Pagination Events
    document.getElementById('prev-invoice-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadInvoices(this.currentInvoiceQuery, this.currentPage);
      }
    });

    document.getElementById('next-invoice-page').addEventListener('click', () => {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadInvoices(this.currentInvoiceQuery, this.currentPage);
      }
    });

    document.getElementById('invoice-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const amount = Number(document.getElementById('amount').value);

      const data = {
        shipmentId: document.getElementById('shipmentId').value || undefined,
        clientId: document.getElementById('clientId').value,
        subtotal: amount,
        total: amount,
        dueDate: document.getElementById('dueDate').value,
      };

      try {
        await dataService.createInvoice(data);
        toast.success('Facture créée');
        modal.style.display = 'none';
        this.loadInvoices(this.currentInvoiceQuery, this.currentPage);
      } catch (err) {
        // Check if it's a permission error
        if (err.message && err.message.includes('Access denied')) {
          toast.error(
            "Accès refusé. Vous n'avez pas les autorisations nécessaires pour créer une facture.",
          );
        } else {
          toast.error('Erreur création facture');
        }
      }
    });
  }

  async loadInvoices(query = '', page = 1) {
    try {
      const res = await dataService.getInvoices(query, page, this.itemsPerPage);
      const { data: list, total, page: currentPage, limit } = res;

      this.totalPages = Math.ceil(total / this.itemsPerPage);
      this.currentPage = currentPage;

      const isMobile = window.innerWidth <= 768;
      const tableContainer = document.getElementById('invoices-table');
      const cardContainer = document.getElementById('invoices-cards');

      const startIndex = (currentPage - 1) * this.itemsPerPage + 1;
      const endIndex = Math.min(currentPage * this.itemsPerPage, total);

      if (isMobile) {
        // Render as cards for mobile
        if (list.length === 0) {
          cardContainer.innerHTML = '<div class="table-empty-state">Aucune facture</div>';
        } else {
          cardContainer.innerHTML = list
            .map(
              (inv) => `
                <div class="invoice-card">
                    <div class="invoice-card-header">
                        <h3 class="invoice-card-title">
                            <span class="invoice-number">${inv.invoiceNumber}</span>
                            <span class="invoice-status">
                              <span class="badge ${this.getStatusBadgeClass(inv.status)}">
                                ${this.getStatusLabel(inv.status)}
                              </span>
                            </span>
                        </h3>
                    </div>
                    <div class="invoice-card-body">
                        <div class="invoice-details">
                            <div class="invoice-detail-row">
                                <span class="invoice-detail-label">Client:</span>
                                <span class="invoice-detail-value">${inv.client?.name || 'Client'}</span>
                            </div>
                            <div class="invoice-detail-row">
                                <span class="invoice-detail-label">Montant:</span>
                                <span class="invoice-detail-value">${formatters.currency(inv.total)}</span>
                            </div>
                            <div class="invoice-detail-row">
                                <span class="invoice-detail-label">Date:</span>
                                <span class="invoice-detail-value">${formatters.date(inv.createdAt)}</span>
                            </div>
                        </div>
                    </div>
                    <div class="invoice-card-footer">
                        <div class="invoice-actions">
                            <button class="btn-icon view-invoice-btn" data-id="${inv.id}" title="Voir/Imprimer"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn-icon edit-status-btn" data-id="${inv.id}" title="Changer statut"><i class="fa-solid fa-rotate"></i></button>
                            <button class="btn-icon copy-btn" data-text="${inv.invoiceNumber}"><i class="fa-regular fa-copy"></i></button>
                        </div>
                    </div>
                </div>
            `,
            )
            .join('');
        }
      } else {
        // Render as table for desktop
        if (list.length === 0) {
          tableContainer.innerHTML =
            '<tr><td colspan="6" style="text-align: center;">Aucune facture</td></tr>';
        } else {
          tableContainer.innerHTML = list
            .map(
              (inv) => `
                    <tr>
                        <td class="font-mono">${inv.invoiceNumber}</td>
                        <td>${inv.client?.name || 'Client'}</td>
                        <td>${formatters.currency(inv.total)}</td>
                        <td>
                            <span class="badge ${this.getStatusBadgeClass(inv.status)}">
                                ${this.getStatusLabel(inv.status)}
                            </span>
                        </td>
                        <td>${formatters.date(inv.createdAt)}</td>
                        <td>
                            <button class="btn-icon view-invoice-btn" data-id="${inv.id}" title="Voir/Imprimer"><i class="fa-solid fa-eye"></i></button>
                            <button class="btn-icon edit-status-btn" data-id="${inv.id}" title="Changer statut"><i class="fa-solid fa-rotate"></i></button>
                             <button class="btn-icon copy-btn" data-text="${inv.invoiceNumber}"><i class="fa-regular fa-copy"></i></button>
                        </td>
                    </tr>
                `,
            )
            .join('');
        }
      }

      // Update pagination info
      document.getElementById('invoice-pagination-start').textContent = startIndex;
      document.getElementById('invoice-pagination-end').textContent = endIndex;
      document.getElementById('invoice-pagination-total').textContent = total;
      document.getElementById('current-invoice-page').textContent = currentPage;

      // Update pagination buttons
      document.getElementById('prev-invoice-page').disabled = currentPage <= 1;
      document.getElementById('next-invoice-page').disabled = currentPage >= this.totalPages;

      // Status Update Modal Logic
      this.setupStatusModal();
      // Details Modal Logic
      this.setupDetailsModal();

      // Attach event listeners for both views
      const container = isMobile ? cardContainer : tableContainer;
      container.querySelectorAll('.edit-status-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.getElementById('status-invoice-id').value = btn.dataset.id;
          document.getElementById('invoice-status-modal').style.display = 'flex';
        });
      });

      container.querySelectorAll('.view-invoice-btn').forEach((btn) => {
        btn.addEventListener('click', async () => {
          try {
            const inv = await dataService.getInvoice(btn.dataset.id);
            this.showDetails(inv.data || inv);
          } catch (e) {
            console.error(e);
            toast.error('Erreur chargement');
          }
        });
      });

      container.querySelectorAll('.copy-btn').forEach((btn) => {
        btn.addEventListener('click', (e) => {
          navigator.clipboard.writeText(e.currentTarget.dataset.text);
          toast.show('Copié !');
        });
      });

      // Bind tariff management button if user is admin
      const addTariffBtn = document.getElementById('add-tariff-btn');
      if (addTariffBtn && (this.state.isAdmin || this.state.get('user')?.role === 'SUPER_ADMIN')) {
        addTariffBtn.addEventListener('click', () => {
          // Open tariff management modal or navigate to tariff management page
          this.showTariffManagement();
        });
      }
    } catch (e) {
      console.error(e);
    }
  }

  setupDetailsModal() {
    if (document.getElementById('invoice-details-modal')) return;

    const html = `
            <div id="invoice-details-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel" style="max-width:800px; width:90%;">
                    <div class="modal-header">
                        <h3>Facture <span id="detail-inv-number"></span></h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div id="invoice-print-area" style="background:white; color:black; padding:2rem; border-radius:4px; margin:1rem 0;">
                        <!-- Invoice Content -->
                    </div>
                    <div style="display:flex; justify-content:flex-end; gap:1rem;">
                        <button class="btn" id="btn-print-invoice"><i class="fa-solid fa-print"></i> Imprimer</button>
                    </div>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('invoice-details-modal');
    modal
      .querySelector('.modal-close')
      .addEventListener('click', () => (modal.style.display = 'none'));

    document.getElementById('btn-print-invoice').addEventListener('click', () => {
      const content = document.getElementById('invoice-print-area').innerHTML;
      const win = window.open('', '', 'height=700,width=900');
      win.document.write('<html><head><title>Facture</title>');
      win.document.write(
        '<style>body{font-family:sans-serif; padding:10px; margin:0; font-size:12px;} table{width:100%; border-collapse:collapse; font-size:12px;} th,td{padding:4px 6px; border-bottom:1px solid #ddd; text-align:left;} .text-right{text-align:right;} .header{display:flex; justify-content:space-between; margin-bottom:0.5rem;} h1{margin:0 0 0.2rem 0; font-size:1.5rem;} h2{margin:0 0 0.2rem 0; font-size:1.2rem;} h3{margin:0.5rem 0 0.2rem 0; font-size:1rem;} h4{margin:0.3rem 0 0.2rem 0; font-size:0.9rem;} p{margin:0.1rem 0; line-height:1.2;} .footer{margin-top:0.5rem; font-size:0.8rem; text-align:center; color:#666;} .payment-summary { border: 1px solid #eee; padding: 15px; margin-top: 20px; border-radius: 8px; background-color: #f9f9f9; } .summary-item { display: flex; justify-content: space-between; padding: 5px 0; } .summary-item.total { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; } .payment-history table { margin-top: 15px; } .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 0.8em; color: white; } .status-paid { background-color: #28a745; } .status-partial { background-color: #ffc107; color: black; } .status-pending { background-color: #dc3545; } </style>',
      );
      console.log(content);

      win.document.write('</head><body>');
      win.document.write(content);
      win.document.write('</body></html>');
      win.document.close();
      win.print();
    });
  }

  showDetails(inv) {
    const modal = document.getElementById('invoice-details-modal');
    document.getElementById('detail-inv-number').textContent = inv.invoiceNumber;

    // Extract shipment details if available
    console.log(inv);

    const s = inv.shipment || {};
    const clientName = inv.client?.name || inv.clientId;

    const content = `
            <div class="header">
                <div>
                    <h1>DLH CARGO</h1>
                    <p>Yaounde, Cameroun</p>
                    <p>contact@dlh-logistics.cm</p>
                    <p>+237 699 00 00 00</p>
                </div>
                <div class="text-right">
                    <h2>FACTURE</h2>
                    <p><strong>N°:</strong> ${inv.invoiceNumber}</p>
                    <p><strong>Date:</strong> ${new Date(inv.createdAt).toLocaleDateString()}</p>
                    <p><strong>Échéance:</strong> ${inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</p>
                    <p><strong>Statut:</strong> <span class="status-badge status-${inv.status.toLowerCase()}">${this.getStatusLabel(inv.status)}</span></p>
                </div>
            </div>

            <div style="margin-bottom:0.5rem; padding:0.5rem; background:rgba(0,0,0,0.02); border-radius:4px;">
                <h3>Facturé à: ${clientName}</h3>
                <p><strong>Email:</strong> ${inv.client?.email || '-'}</p>
                <p><strong>Tel:</strong> ${inv.client?.phone || '-'}</p>
            </div>

            ${
              s.id
                ? `
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1rem; margin-bottom:0.5rem; padding-bottom:0.5rem; border-bottom:1px dashed #ccc;">
                <div>
                    <h4 style="color:#666; text-transform:uppercase; font-size:0.8rem; margin-bottom:0.2rem;">Expéditeur</h4>
                    <p><strong>${s.senderName || '-'}</strong></p>
                    <p>${s.senderAddress || '-'}</p>
                    <p>${s.senderPhone || '-'}</p>
                </div>
                <div>
                    <h4 style="color:#666; text-transform:uppercase; font-size:0.8rem; margin-bottom:0.2rem;">Destinataire</h4>
                    <p><strong>${s.receiverName || s.recipientName || '-'}</strong></p>
                    <p>${s.receiverAddress || s.recipientAddress || '-'}</p>
                    <p>${s.receiverPhone || '-'}</p>
                </div>
            </div>

            <div style="margin-bottom:0.5rem; padding-top:0.5rem;">
                <h4 style="color:#333; text-transform:uppercase; font-size:0.9rem; margin-bottom:0.3rem; border-bottom: 1px solid var(--primary); display:inline-block; padding-bottom:2px;">Détails de l'expédition</h4>
                <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:0.5rem; font-size:0.9rem;">
                    <div>
                        <div style="margin-bottom:0.2rem;"><span style="color:#666;">Poids:</span> <strong style="float:right;">${s.weight} kg</strong></div>
                        <div style="margin-bottom:0.2rem;"><span style="color:#666;">Dimensions:</span> <strong style="float:right;">${s.dimensions || '-'}</strong></div>
                        <div style="margin-bottom:0.2rem;"><span style="color:#666;">Colis:</span> <strong style="float:right;">${s.numberOfPackages || 1}</strong></div>
                        <div><span style="color:#666;">Type de service:</span> <strong style="float:right;">${s.serviceType || 'Standard'}</strong></div>
                    </div>
                    <div>
                        <div style="margin-bottom:0.2rem;"><span style="color:#666;">Ville d'expédition:</span> <strong style="float:right;">${s.originCity || s.origin || '-'}</strong></div>
                        <div style="margin-bottom:0.2rem;"><span style="color:#666;">Ville de destination:</span> <strong style="float:right;">${s.destinationCity || s.destination || '-'}${s.receiverCity ? ` (${s.receiverCity})` : ''}</strong></div>
                        <div style="margin-bottom:0.2rem;"><span style="color:#666;">Créé par:</span> <strong style="float:right;">${s.createdBy?.name || 'Système'}</strong></div>
                        <div><span style="color:#666;">Date de création:</span> <strong style="float:right;">${new Date(s.createdAt).toLocaleDateString()}</strong></div>
                    </div>
                </div>
            </div>
            `
                : '<p style="font-style:italic; color:#666; margin-bottom:0.5rem;">Aucune expédition liée.</p>'
            }

            <table style="width:100%; border-collapse:collapse; margin-top:0.5rem;">
                <thead>
                    <tr style="background:#f9f9f9;">
                        <th style="padding:6px; text-align:left; border-bottom:2px solid #ddd;">Description</th>
                        <th style="padding:6px; text-align:right; border-bottom:2px solid #ddd;">Montant</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td style="padding:6px; border-bottom:1px solid #eee;">
                            <strong>Service Transport & Logistique</strong><br>
                            ${
                              s.trackingNumber
                                ? `<small>
                                Client: ${clientName}<br>
                                Ref. Colis: ${s.trackingNumber}<br>
                                Origine: ${s.origin || '-'} | Destination: ${s.destination || '-'}<br>
                                Poids: ${s.weight ? `${s.weight} kg` : '-'}
                            </small>`
                                : ''
                            }
                        </td>
                        <td style="padding:6px; border-bottom:1px solid #eee; text-align:right;">${formatters.currency(inv.subtotal)}</td>
                    </tr>
                </tbody>
            </table>

            <div id="payment-summary-section"></div>
            <div id="invoice-payments-list" class="payment-history"></div>

            <div style="margin-top:1rem; padding-top:1rem; border-top:1px solid #eee;">
                <h4 style="margin-bottom:0.5rem; color:#333;">Paiements</h4>
                <div style="display:flex; gap:1rem; align-items:end;">
                    <div style="flex:1;">
                        <label>Montant à payer (XAF)</label>
                        <input type="number" id="payment-amount" placeholder="Montant du paiement" min="0" max="${inv.balance}" style="width:100%;">
                    </div>
                    <button id="record-payment-btn" class="btn btn-success" style="white-space:nowrap;">
                        <i class="fa-solid fa-credit-card"></i> Enregistrer Paiement
                    </button>
                </div>
            </div>

            <div class="footer">
                <p>Merci de votre confiance.</p>
                <p>DLH Logistics S.A.R.L - RC: 12345/DLA/2026</p>
            </div>
        `;

    document.getElementById('invoice-print-area').innerHTML = content;
    modal.style.display = 'flex';

    // Load and display payments for this invoice
    this.loadInvoicePayments(inv.id);

    // Add payment event listener
    document.getElementById('record-payment-btn').addEventListener('click', async () => {
      const amount = parseFloat(document.getElementById('payment-amount').value);
      if (!amount || amount <= 0) {
        toast.error('Veuillez entrer un montant valide');
        return;
      }

      if (amount > inv.balance) {
        toast.error('Le montant du paiement dépasse le solde de la facture');
        return;
      }

      try {
        await dataService.recordPayment({
          invoiceId: inv.id,
          amount: amount,
          method: 'CASH', // Default payment method
          status: 'COMPLETED', // Default status
        });

        toast.success('Paiement enregistré');
        document.getElementById('payment-amount').value = '';
        this.loadInvoicePayments(inv.id); // Reload payments
        this.loadInvoices(this.currentInvoiceQuery, this.currentPage); // Reload invoice list to update status
      } catch (err) {
        toast.error(err.message || 'Erreur enregistrement paiement');
      }
    });
  }

  async loadInvoicePayments(invoiceId) {
    try {
      const summary = await dataService.getInvoicePaymentSummary(invoiceId);
      console.log('summarry=====>', summary);

      const { total, amountPaid, balance, payments } = summary;

      const summaryContainer = document.getElementById('payment-summary-section');
      summaryContainer.innerHTML = `
        <div class="payment-summary">
          <div class="summary-item">
            <span>Total Facture:</span>
            <span>${formatters.currency(total)}</span>
          </div>
          <div class="summary-item">
            <span>Montant Payé:</span>
            <span>${formatters.currency(amountPaid)}</span>
          </div>
          <div class="summary-item total">
            <span>Solde Restant:</span>
            <span>${formatters.currency(balance)}</span>
          </div>
        </div>
      `;

      const historyContainer = document.getElementById('invoice-payments-list');
      if (payments.length === 0) {
        historyContainer.innerHTML =
          '<p style="color:var(--text-muted); font-style:italic; margin-top:1rem;">Aucun paiement enregistré</p>';
        return;
      }

      console.log('============>', payments);

      historyContainer.innerHTML = `
        <h4 style="margin-top:1.5rem; margin-bottom:0.5rem;">Historique des Paiements</h4>
        <table style="width:100%; border-collapse:collapse;">
          <thead>
            <tr style="background:#f9f9f9;">
              <th style="padding:6px; text-align:left; border-bottom:2px solid #ddd;">Date</th>
              <th style="padding:6px; text-align:left; border-bottom:2px solid #ddd;">Montant</th>
              <th style="padding:6px; text-align:left; border-bottom:2px solid #ddd;">Méthode</th>
              <th style="padding:6px; text-align:left; border-bottom:2px solid #ddd;">Traité par</th>
            </tr>
          </thead>
          <tbody>
            ${payments
              .map(
                (payment) => `
              <tr>
                <td style="padding:6px; border-bottom:1px solid #eee;color:#000;">${new Date(payment.createdAt).toLocaleDateString()}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;color:#000;">${formatters.currency(payment.amount)}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;color:#000;">${payment.method}</td>
                <td style="padding:6px; border-bottom:1px solid #eee;color:#000;">${payment.processedBy?.name || 'N/A'}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      `;
    } catch (err) {
      console.error('Error loading invoice payments:', err);
      const container = document.getElementById('invoice-payments-list');
      if (container) {
        container.innerHTML = '<p style="color:var(--danger);">Erreur chargement des paiements</p>';
      }
    }
  }

  setupStatusModal() {
    if (document.getElementById('invoice-status-modal')) return;

    const html = `
            <div id="invoice-status-modal" class="modal-overlay hidden" style="display:none;">
                <div class="modal-container glass-panel">
                    <div class="modal-header">
                        <h3>Mettre à jour le statut</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <form id="invoice-status-form">
                        <input type="hidden" id="status-invoice-id">
                        <div class="form-group">
                            <label>Nouveau Statut</label>
                            <select id="new-invoice-status" required>
                                <option value="PENDING">EN ATTENTE</option>
                                <option value="PAID">PAYÉ</option>
                                <option value="CANCELLED">ANNULÉ</option>
                                <option value="OVERDUE">EN RETARD</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary w-full">Enregistrer</button>
                    </form>
                </div>
            </div>
        `;
    document.body.insertAdjacentHTML('beforeend', html);

    const modal = document.getElementById('invoice-status-modal');
    const hide = () => (modal.style.display = 'none');
    modal.querySelector('.modal-close').addEventListener('click', hide);

    document.getElementById('invoice-status-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('status-invoice-id').value;
      const status = document.getElementById('new-invoice-status').value;

      try {
        await dataService.updateInvoice(id, { status });
        toast.success('Statut mis à jour');
        hide();
        this.loadInvoices(this.currentInvoiceQuery, this.currentPage); // Refresh list with current pagination

        // Refresh stats too
        const stats = await dataService.getInvoiceStats();
        if (stats) {
          // Quick stats update (optional, usually re-render whole view or specific elements)
          // For now simple reload of invoices is enough visual feedback
        }
      } catch (err) {
        toast.error('Erreur mise à jour');
      }
    });
  }

  async loadTariffs() {
    try {
      const res = await dataService.getTariffs();
      const list = res.data || res;
      const container = document.getElementById('tariffs-list');

      if (list.length === 0) {
        container.innerHTML = '<p>Aucun tarif configuré.</p>';
        return;
      }

      container.innerHTML = list
        .map(
          (t) => `
                <div style="background:rgba(255,255,255,0.05); padding:10px; border-radius:8px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <strong>${t.origin} <i class="fa-solid fa-arrow-right"></i> ${t.destination}</strong><br>
                        <small>${t.minWeight}-${t.maxWeight}kg</small>
                    </div>
                    <div style="text-align:right;">
                        <strong style="color:var(--primary);">${t.basePrice} XAF</strong><br>
                        <small>+${t.pricePerKg}/kg</small>
                    </div>
                </div>
            `,
        )
        .join('');
    } catch (e) {
      console.error(e);
    }
  }

  async loadTariffRates() {
    try {
      const response = await fetch('/api/v1/tariffs', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const { data: tariffs } = await response.json();
      const container = document.getElementById('tariff-rates-display');

      if (tariffs.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid var(--border); grid-column: 1 / -1;">
            <div style="font-size: 1.8rem; font-weight: bold; color: var(--primary); margin-bottom: 0.5rem;">-</div>
            <div style="font-size: 0.9rem; color: var(--text-muted);">Aucun tarif configuré</div>
          </div>
        `;
        return;
      }

      container.innerHTML = tariffs
        .map(
          (tariff) => `
        <div class="glass-panel" style="padding: 1.5rem; border-radius: 12px; border: 1px solid var(--border);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <div>
              <div style="font-size: 1.2rem; font-weight: 600; color: var(--primary);">${tariff.origin}</div>
              <div style="font-size: 0.9rem; color: var(--text-muted);">${tariff.destination}</div>
            </div>
            <div style="text-align: right;">
              <div style="font-size: 1.5rem; font-weight: bold; color: var(--success);">${tariff.pricePerKg} XAF</div>
              <div style="font-size: 0.8rem; color: var(--text-muted);">/kg</div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
            <div style="font-size: 0.8rem; color: var(--text-muted);">Base:</div>
            <div style="text-align: right; font-weight: 500;">${tariff.basePrice} XAF</div>

            <div style="font-size: 0.8rem; color: var(--text-muted);">Poids:</div>
            <div style="text-align: right; font-weight: 500;">${tariff.minWeight || '0'}-${tariff.maxWeight || '∞'} kg</div>

            <div style="font-size: 0.8rem; color: var(--text-muted);">Service:</div>
            <div style="text-align: right; font-weight: 500;">${tariff.serviceType || 'Standard'}</div>
          </div>
        </div>
      `,
        )
        .join('');
    } catch (error) {
      console.error('Error loading tariff rates:', error);
      const container = document.getElementById('tariff-rates-display');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 1.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 12px; border: 1px solid var(--border); grid-column: 1 / -1;">
            <div style="font-size: 1.8rem; font-weight: bold; color: var(--danger); margin-bottom: 0.5rem;"><i class="fa-solid fa-exclamation-triangle"></i></div>
            <div style="font-size: 0.9rem; color: var(--text-muted);">Erreur de chargement des tarifs</div>
          </div>
        `;
      }
    }
  }

  showTariffManagement() {
    // Create a modal for tariff management
    const modalHtml = `
      <div id="tariff-management-modal" class="modal-overlay" style="display:flex; align-items:center; justify-content:center; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); z-index:1000;">
        <div class="modal-container glass-panel" style="max-width:600px; width:90%; max-height:90vh; overflow-y:auto; padding:1.5rem;">
          <div class="modal-header" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem;">
            <h3>Gestion des Tarifs</h3>
            <button class="modal-close" style="background:none; border:none; font-size:1.5rem; cursor:pointer;">&times;</button>
          </div>

          <form id="tariff-form">
            <div class="form-group" style="margin-bottom:1rem;">
              <label>Origine</label>
              <input type="text" id="tariff-origin" placeholder="Pays d'origine" required class="input w-full">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label>Destination</label>
              <input type="text" id="tariff-destination" placeholder="Pays de destination" required class="input w-full">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label>Prix de base (XAF)</label>
              <input type="number" id="tariff-base-price" placeholder="Prix pour le premier kg" required class="input w-full">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label>Prix par kg supplémentaire (XAF)</label>
              <input type="number" id="tariff-price-per-kg" placeholder="Prix par kg supplémentaire" required class="input w-full">
            </div>

            <div class="form-group" style="margin-bottom:1rem;">
              <label>Type de service (facultatif)</label>
              <input type="text" id="tariff-service-type" placeholder="Standard, Express, etc." class="input w-full">
            </div>

            <div class="form-group" style="margin-bottom:1.5rem;">
              <label>Poids minimum (kg) (facultatif)</label>
              <input type="number" step="0.1" id="tariff-min-weight" placeholder="Poids minimum" class="input w-full">
            </div>

            <button type="submit" class="btn btn-primary w-full">Enregistrer</button>
          </form>
        </div>
      </div>
    `;

    // Add modal to document
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Bind events for the modal
    const modal = document.getElementById('tariff-management-modal');
    const closeModal = () => modal.remove();

    modal.querySelector('.modal-close').addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    // Form submission
    document.getElementById('tariff-form').addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = {
        origin: document.getElementById('tariff-origin').value,
        destination: document.getElementById('tariff-destination').value,
        basePrice: Number(document.getElementById('tariff-base-price').value),
        pricePerKg: Number(document.getElementById('tariff-price-per-kg').value),
        serviceType: document.getElementById('tariff-service-type').value || null,
        minWeight: document.getElementById('tariff-min-weight').value
          ? Number(document.getElementById('tariff-min-weight').value)
          : null,
      };

      try {
        const response = await fetch('/api/v1/tariffs', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        toast.success('Tarif enregistré');
        closeModal();
        this.loadTariffRates(); // Refresh the tariff display
      } catch (err) {
        console.error('Error creating tariff:', err);
        toast.error('Erreur enregistrement tarif');
      }
    });
  }
}
