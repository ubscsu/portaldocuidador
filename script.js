document.addEventListener('DOMContentLoaded', () => {
    initContentController();
    initDraggableCarousel();
    initMasks(); // Inicia as formatações automáticas de CEP e Telefone
});

/**
 * Módulo 1: Controlador de Exibição dos Painéis 
 */
function initContentController() {
    const navLinks = document.querySelectorAll('.nav-tab-link');
    const panels = document.querySelectorAll('.content-panel');
    const mainContentArea = document.getElementById('main-content-area'); 

    function showPanel(targetIndex) {
        
        let isOpeningNow = false;
        if (mainContentArea.classList.contains('hidden-area')) {
            mainContentArea.classList.remove('hidden-area');
            mainContentArea.classList.add('visible-area');
            isOpeningNow = true; 
        }
        
        panels.forEach(panel => {
            panel.classList.remove('show');
            setTimeout(() => {
                panel.classList.remove('active');
            }, 300); 
        });

        setTimeout(() => {
            const targetPanel = document.getElementById(`panel-${targetIndex}`);
            if (targetPanel) {
                targetPanel.classList.add('active');
                setTimeout(() => targetPanel.classList.add('show'), 50); 
            }
        }, 300);

        const scrollDelay = isOpeningNow ? 150 : 0; 
        
        setTimeout(() => {
            const element = document.getElementById('main-content-area');
            if (element) {
                const yOffset = -30;
                const y = element.getBoundingClientRect().top + window.scrollY + yOffset;
                window.scrollTo({top: y, behavior: 'smooth'});
            }
        }, scrollDelay);
    }

    navLinks.forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault(); 
            const target = trigger.getAttribute('data-target');
            if (target !== null) showPanel(target);
        });
    });
}

/**
 * Módulo 2: Controlador do Carrossel (Swipe e Mobile Fix)
 */
function initDraggableCarousel() {
    const track = document.getElementById('sliderTrack');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');

    if (!track) return; 

    let isDragging = false;
    let startX;
    let currentTranslate = 0;
    let prevTranslate = 0;
    let animationID;

    function getCardWidth() {
        const card = document.querySelector('.slide-card');
        const gap = 25; 
        return card ? card.offsetWidth + gap : 385;
    }

    track.addEventListener('mousedown', startDrag);
    track.addEventListener('mousemove', drag);
    track.addEventListener('mouseup', endDrag);
    track.addEventListener('mouseleave', endDrag);
    
    track.addEventListener('touchstart', startDrag, { passive: true });
    track.addEventListener('touchmove', drag, { passive: true });
    track.addEventListener('touchend', endDrag);

    function startDrag(e) {
        isDragging = true;
        startX = getPositionX(e);
        track.style.transition = 'none'; 
        animationID = requestAnimationFrame(animation);
    }

    function drag(e) {
        if (!isDragging) return;
        const currentX = getPositionX(e);
        currentTranslate = prevTranslate + (currentX - startX);
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        cancelAnimationFrame(animationID);
        track.style.transition = 'transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)'; 

        const movedBy = currentTranslate - prevTranslate;
        const jumpWidth = getCardWidth();

        if (movedBy < -50) currentTranslate = prevTranslate - jumpWidth;
        else if (movedBy > 50) currentTranslate = prevTranslate + jumpWidth;
        else currentTranslate = prevTranslate;
        
        clampTranslate();
    }

    function getPositionX(e) {
        return e.type.includes('mouse') ? e.pageX : e.touches[0].clientX;
    }

    function animation() {
        track.style.transform = `translateX(${currentTranslate}px)`;
        if (isDragging) requestAnimationFrame(animation);
    }

    function clampTranslate() {
        const maxScroll = -(track.scrollWidth - track.parentElement.clientWidth + 25);
        if (currentTranslate > 0) currentTranslate = 0;
        if (currentTranslate < maxScroll) currentTranslate = maxScroll;
        
        prevTranslate = currentTranslate;
        track.style.transform = `translateX(${currentTranslate}px)`;
    }

    if(nextBtn && prevBtn) {
        nextBtn.addEventListener('click', () => { currentTranslate -= getCardWidth(); clampTranslate(); });
        prevBtn.addEventListener('click', () => { currentTranslate += getCardWidth(); clampTranslate(); });
    }

    window.addEventListener('resize', clampTranslate);
}

/**
 * Módulo 3: Máscaras Automáticas (Formatação em tempo real)
 */
function initMasks() {
    // Máscara do CEP
    const campoCep = document.getElementById('cep-input');
    if (campoCep) {
        campoCep.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, ''); // Remove tudo que não for número
            if (valor.length > 5) {
                valor = valor.replace(/^(\d{5})(\d)/, '$1-$2'); // Insere o traço
            }
            e.target.value = valor;
        });
    }

    // Máscara do Celular / WhatsApp
    const campoTelefone = document.getElementById('telefone');
    if (campoTelefone) {
        campoTelefone.addEventListener('input', function(e) {
            let valor = e.target.value.replace(/\D/g, ''); 
            
            // Aplica a formatação: (XX) XXXXX-XXXX
            if (valor.length > 10) {
                valor = valor.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3');
            } else if (valor.length > 5) {
                valor = valor.replace(/^(\d{2})(\d{4,5})(\d{0,4}).*/, '($1) $2-$3');
            } else if (valor.length > 2) {
                valor = valor.replace(/^(\d{2})(\d{0,5})/, '($1) $2');
            } else {
                valor = valor.replace(/^(\d*)/, '($1');
                if (valor === '(') valor = ''; // Limpa se apagar tudo
            }
            e.target.value = valor;
        });
    }
}


// =========================================================================
// MÓDULO 4: VALIDAÇÃO DE CEP E ENVIO DE E-MAIL (ESCOPO GLOBAL)
// =========================================================================

// Whitelist exata de CEPs atendidos pela UBS Eldorado (armazenada em um Set para performance)
const cepsValidosEldorado = new Set([
    '32010130', '32015020', '32015286', '32015690', '32016040', '32025012', 
    '32025018', '32025035', '32040010', '32040320', '32041002', '32044140', 
    '32044250', '32046278', '32046292', '32050365', '32050375', '32051060', 
    '32051072', '32052042', '32055070', '32060295', '32062050', '32064600', 
    '32065442', '32073170', '32110133', '32110138', '32113345', '32113482', 
    '32140200', '32140540', '32140683', '32145320', '32145380', '32145550', 
    '32150370', '32220102', '32220530', '32223340', '32230110', '32230150', 
    '32235230', '32241003', '32265390', '32280330', '32280600', '32285090', 
    '32310210', '32310370', '32310430', '32310440', '32310450', '32310470', 
    '32310475', '32310480', '32310490', '32310500', '32310510', '32310520', 
    '32310530', '32310550', '32310560', '32310670', '32310675', '32315040', 
    '32315170', '32315172', '32340010', '32340020', '32340030', '32340040', 
    '32340050', '32340060', '32340070', '32340080', '32340090', '32340100', 
    '32340110', '32340120', '32340130', '32340140', '32340160', '32340170', 
    '32340640', '32341010', '32341020', '32341030', '32341050', '32341060', 
    '32341070', '32341080', '32341110', '32341130', '32341140', '32341180', 
    '32341420', '32341485', '32341610', '32342080', '32342100', '32371600'
]);

function verificarCEP() {
    const cepInput = document.getElementById('cep-input').value;
    const cepLimpo = cepInput.replace(/\D/g, ''); 
    
    const cepMsg = document.getElementById('cep-msg');
    const formSection = document.getElementById('form-section');

    if (cepLimpo.length !== 8) {
        cepMsg.textContent = "Por favor, digite um CEP válido com 8 dígitos.";
        cepMsg.style.display = 'block';
        formSection.style.display = 'none';
        return;
    }

    // Busca direta O(1) no Set de CEPs permitidos
    const cepValido = cepsValidosEldorado.has(cepLimpo);

    if (cepValido) {
        cepMsg.style.display = 'none';
        formSection.style.display = 'block';
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        formSection.style.display = 'none';
        cepMsg.textContent = "Desculpe, não identificamos cobertura da UBS Eldorado para o CEP informado.";
        cepMsg.style.display = 'block';
    }
}

// --- ENVIO DO FORMULÁRIO (EmailJS) ---
function enviarFormulario(event) {
    event.preventDefault(); 
    
    const btnSubmit = document.querySelector('#atendimento-form button[type="submit"]');
    const textoOriginal = btnSubmit.innerHTML;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    btnSubmit.disabled = true;

    const parametrosTemplate = {
        nome: document.getElementById('nome').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefone: document.getElementById('telefone').value,
        endereco: document.getElementById('endereco').value,
        mensagem: document.getElementById('mensagem').value,
        cep: document.getElementById('cep-input').value
    };

    const serviceID = "service_8i8nvqb"; 
    const templateID = "template_21d99c8"; 

    emailjs.send(serviceID, templateID, parametrosTemplate)
        .then(function(resposta) {
            alert("Sucesso! Sua solicitação foi enviada. Nossa equipe entrará em contato em breve.");
            document.getElementById('atendimento-form').reset(); 
            document.getElementById('form-section').style.display = 'none'; 
            document.getElementById('cep-input').value = ''; 
            
            document.getElementById('cep-section').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, function(erro) {
            alert("Ocorreu um erro ao enviar. Por favor, tente novamente mais tarde.");
            console.log("Erro EmailJS:", erro);
        })
        .finally(function() {
            btnSubmit.innerHTML = textoOriginal;
            btnSubmit.disabled = false;
        });
}