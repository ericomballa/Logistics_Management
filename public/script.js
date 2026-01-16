// Configuration de base
const API_BASE_URL = 'http://localhost:3000'; // À modifier selon votre configuration
let authToken = localStorage.getItem('authToken');

// Éléments DOM
const sections = {
    auth: document.getElementById('auth-section'),
    dashboard: document.getElementById('dashboard-section'),
    shipments: document.getElementById('shipments-section'),
    tracking: document.getElementById('tracking-section'),
    reports: document.getElementById('reports-section')
};

const authLink = document.getElementById('auth-link');
const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');

// Navigation
document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const targetSection = e.target.getAttribute('href').substring(1);
        
        // Cacher toutes les sections
        Object.values(sections).forEach(section => {
            section.classList.add('hidden');
        });
        
        // Afficher la section ciblée
        if (sections[targetSection]) {
            sections[targetSection].classList.remove('hidden');
            
            // Charger les données spécifiques à la section
            switch(targetSection) {
                case 'dashboard':
                    loadDashboardStats();
                    break;
                case 'shipments':
                    loadShipments();
                    break;
                case 'tracking':
                    // Rien à charger automatiquement pour le suivi
                    break;
                case 'reports':
                    // Charger les graphiques si nécessaire
                    break;
            }
        }
    });
});

// Gestion de l'authentification
showRegisterLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
});

showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('login-form').classList.remove('hidden');
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            authToken = data.access_token;
            localStorage.setItem('authToken', authToken);
            updateAuthUI();
            alert('Connexion réussie!');
            // Rediriger vers le tableau de bord
            sections.auth.classList.add('hidden');
            sections.dashboard.classList.remove('hidden');
        } else {
            alert(data.message || 'Erreur de connexion');
        }
    } catch (error) {
        console.error('Erreur de connexion:', error);
        alert('Une erreur est survenue lors de la connexion');
    }
});

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert('Inscription réussie! Veuillez vous connecter.');
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        } else {
            alert(data.message || 'Erreur d\'inscription');
        }
    } catch (error) {
        console.error('Erreur d\'inscription:', error);
        alert('Une erreur est survenue lors de l\'inscription');
    }
});

// Mise à jour de l'interface utilisateur en fonction de l'état d'authentification
function updateAuthUI() {
    if (authToken) {
        authLink.textContent = 'Déconnexion';
        authLink.onclick = () => {
            authToken = null;
            localStorage.removeItem('authToken');
            updateAuthUI();
            // Rediriger vers la page d'accueil ou de connexion
            Object.values(sections).forEach(section => {
                section.classList.add('hidden');
            });
            sections.auth.classList.remove('hidden');
        };
    } else {
        authLink.textContent = 'Connexion';
        authLink.onclick = () => {
            Object.values(sections).forEach(section => {
                section.classList.add('hidden');
            });
            sections.auth.classList.remove('hidden');
        };
    }
}

// Charger les statistiques du tableau de bord
async function loadDashboardStats() {
    if (!authToken) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/shipments/stats`, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const stats = await response.json();
            document.getElementById('totalShipments').textContent = stats.total || 0;
            document.getElementById('inTransitShipments').textContent = stats.inTransit || 0;
            document.getElementById('deliveredShipments').textContent = stats.delivered || 0;
            document.getElementById('recentShipments').textContent = stats.recent || 0;
        }
    } catch (error) {
        console.error('Erreur lors du chargement des statistiques:', error);
    }
}

// Gestion des expéditions
const shipmentForm = document.getElementById('shipmentForm');
shipmentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!authToken) {
        alert('Veuillez vous connecter pour créer une expédition');
        return;
    }
    
    const shipmentData = {
        senderName: document.getElementById('senderName').value,
        senderAddress: document.getElementById('senderAddress').value,
        recipientName: document.getElementById('recipientName').value,
        recipientAddress: document.getElementById('recipientAddress').value,
        weight: parseFloat(document.getElementById('weight').value),
        dimensions: document.getElementById('dimensions').value,
        estimatedDeliveryDate: document.getElementById('estimatedDeliveryDate').value,
        serviceType: document.getElementById('serviceType').value
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/shipments`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`
            },
            body: JSON.stringify(shipmentData)
        });
        
        if (response.ok) {
            alert('Expédition créée avec succès!');
            shipmentForm.reset();
            loadShipments(); // Recharger la liste des expéditions
        } else {
            const error = await response.json();
            alert(error.message || 'Erreur lors de la création de l\'expédition');
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'expédition:', error);
        alert('Une erreur est survenue lors de la création de l\'expédition');
    }
});

// Charger la liste des expéditions
async function loadShipments(filters = {}) {
    if (!authToken) return;
    
    try {
        let url = `${API_BASE_URL}/shipments`;
        const queryParams = new URLSearchParams(filters);
        if (queryParams.toString()) {
            url += '?' + queryParams.toString();
        }
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            const shipments = await response.json();
            displayShipments(shipments.data || shipments);
        }
    } catch (error) {
        console.error('Erreur lors du chargement des expéditions:', error);
    }
}

// Afficher les expéditions dans le tableau
function displayShipments(shipments) {
    const tbody = document.getElementById('shipmentsTableBody');
    tbody.innerHTML = '';
    
    shipments.forEach(shipment => {
        const row = document.createElement('tr');
        
        // Déterminer la classe de statut pour le badge
        let statusClass = '';
        switch(shipment.status?.toLowerCase()) {
            case 'pending':
                statusClass = 'status-pending';
                break;
            case 'in_transit':
            case 'in transit':
                statusClass = 'status-in-transit';
                break;
            case 'delivered':
                statusClass = 'status-delivered';
                break;
            case 'cancelled':
                statusClass = 'status-cancelled';
                break;
            default:
                statusClass = 'status-pending'; // Valeur par défaut
        }
        
        row.innerHTML = `
            <td>${shipment.trackingNumber || shipment.id}</td>
            <td>${shipment.senderName || 'N/A'}</td>
            <td>${shipment.recipientName || 'N/A'}</td>
            <td>${new Date(shipment.createdAt || shipment.created_at).toLocaleDateString()}</td>
            <td><span class="status-badge ${statusClass}">${shipment.status || 'Pending'}</span></td>
            <td>
                <button class="action-btn" onclick="viewShipment('${shipment.id}')">Voir</button>
                <button class="action-btn" onclick="updateShipment('${shipment.id}')">Modifier</button>
                <button class="action-btn delete" onclick="deleteShipment('${shipment.id}')">Supprimer</button>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Fonction pour rechercher des expéditions
document.getElementById('searchBtn').addEventListener('click', () => {
    const searchTerm = document.getElementById('searchShipments').value;
    if (searchTerm) {
        loadShipments({ trackingNumber: searchTerm });
    } else {
        loadShipments();
    }
});

// Fonction pour suivre une expédition
document.getElementById('trackShipmentBtn').addEventListener('click', async () => {
    const trackingNumber = document.getElementById('trackingNumberInput').value;
    
    if (!trackingNumber) {
        alert('Veuillez entrer un numéro de suivi');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/shipments/track/${trackingNumber}`);
        
        if (response.ok) {
            const shipment = await response.json();
            displayTrackingResult(shipment);
        } else {
            alert('Expédition non trouvée');
        }
    } catch (error) {
        console.error('Erreur lors du suivi de l\'expédition:', error);
        alert('Une erreur est survenue lors de la recherche de l\'expédition');
    }
});

// Afficher les résultats du suivi
function displayTrackingResult(shipment) {
    const resultDiv = document.getElementById('trackingResult');
    const detailsDiv = document.getElementById('shipmentDetails');
    const timelineDiv = document.getElementById('trackingTimeline');
    
    // Afficher les détails de l'expédition
    detailsDiv.innerHTML = `
        <h4>Informations de l'expédition</h4>
        <p><strong>Numéro de suivi:</strong> ${shipment.trackingNumber || shipment.id}</p>
        <p><strong>Expéditeur:</strong> ${shipment.senderName || 'N/A'}</p>
        <p><strong>Destinataire:</strong> ${shipment.recipientName || 'N/A'}</p>
        <p><strong>Status:</strong> <span class="status-badge status-${shipment.status?.toLowerCase().replace('_', '-') || 'pending'}">${shipment.status || 'Pending'}</span></p>
        <p><strong>Date de création:</strong> ${new Date(shipment.createdAt || shipment.created_at).toLocaleDateString()}</p>
    `;
    
    // Afficher la chronologie de suivi si disponible
    if (shipment.trackingEvents && shipment.trackingEvents.length > 0) {
        timelineDiv.innerHTML = '<h4>Chronologie du suivi</h4><div class="timeline">';
        
        shipment.trackingEvents.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .forEach(event => {
                timelineDiv.innerHTML += `
                    <div class="timeline-item">
                        <div class="timeline-date">${new Date(event.timestamp).toLocaleString()}</div>
                        <div class="timeline-status">${event.status}</div>
                        <div class="timeline-description">${event.description || ''}</div>
                        <div class="timeline-location">${event.location || ''}</div>
                    </div>
                `;
            });
        
        timelineDiv.innerHTML += '</div>';
    } else {
        timelineDiv.innerHTML = '<p>Aucun événement de suivi disponible pour cette expédition.</p>';
    }
    
    resultDiv.classList.remove('hidden');
}

// Fonctions pour les actions sur les expéditions (à implémenter complètement)
function viewShipment(id) {
    alert(`Affichage de l'expédition ID: ${id}`);
    // Implémenter la logique pour afficher les détails de l'expédition
}

function updateShipment(id) {
    alert(`Modification de l'expédition ID: ${id}`);
    // Implémenter la logique pour modifier l'expédition
}

async function deleteShipment(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette expédition?')) {
        return;
    }
    
    if (!authToken) {
        alert('Veuillez vous connecter pour supprimer une expédition');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/shipments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (response.ok) {
            alert('Expédition supprimée avec succès!');
            loadShipments(); // Recharger la liste
        } else {
            const error = await response.json();
            alert(error.message || 'Erreur lors de la suppression de l\'expédition');
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'expédition:', error);
        alert('Une erreur est survenue lors de la suppression de l\'expédition');
    }
}

// Initialisation de l'application
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
    
    // Vérifier si l'utilisateur est déjà connecté
    if (authToken) {
        // Si l'utilisateur est connecté, afficher le tableau de bord par défaut
        Object.values(sections).forEach(section => {
            section.classList.add('hidden');
        });
        sections.dashboard.classList.remove('hidden');
        loadDashboardStats();
    } else {
        // Sinon, afficher la section d'authentification
        Object.values(sections).forEach(section => {
            section.classList.add('hidden');
        });
        sections.auth.classList.remove('hidden');
    }
});