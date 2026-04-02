// ==UserScript==
// @name         🇧🇷 Brasil Form Filler (Faker)
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  Preenche formulários com dados brasileiros aleatórios via Faker.js (pt_BR). Suporte especial para Softex/Brasil IT+.
// @author       Custom
// @match        *://*/*
// @match        http://localhost:3000/*
// @match        http://localhost:3001/*
// @match        http://localhost/*
// @match        http://127.0.0.1/*
// @require      https://cdn.jsdelivr.net/npm/faker@5.5.3/dist/faker.min.js
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // ==================== FAKER SETUP ====================

    faker.locale = 'pt_BR';

    // ==================== UTILITÁRIOS ====================

    function rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    function pick(arr) {
        return arr[rand(0, arr.length - 1)];
    }

    // ==================== GERADORES (Documentos BR — custom, faker não suporta) ====================

    function gerarCPF(formatado = true) {
        const n = Array.from({ length: 9 }, () => rand(0, 9));
        let soma = n.reduce((acc, v, i) => acc + v * (10 - i), 0);
        let resto = soma % 11;
        n.push(resto < 2 ? 0 : 11 - resto);
        soma = n.reduce((acc, v, i) => acc + v * (11 - i), 0);
        resto = soma % 11;
        n.push(resto < 2 ? 0 : 11 - resto);
        if (!formatado) return n.join('');
        return `${n[0]}${n[1]}${n[2]}.${n[3]}${n[4]}${n[5]}.${n[6]}${n[7]}${n[8]}-${n[9]}${n[10]}`;
    }

    function gerarCNPJ(formatado = true) {
        const n = [...Array.from({ length: 8 }, () => rand(0, 9)), 0, 0, 0, 1];
        const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        let soma = n.slice(0, 12).reduce((acc, v, i) => acc + v * w1[i], 0);
        let resto = soma % 11;
        n.push(resto < 2 ? 0 : 11 - resto);
        const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
        soma = n.slice(0, 13).reduce((acc, v, i) => acc + v * w2[i], 0);
        resto = soma % 11;
        n.push(resto < 2 ? 0 : 11 - resto);
        if (!formatado) return n.join('');
        return `${n[0]}${n[1]}.${n[2]}${n[3]}${n[4]}.${n[5]}${n[6]}${n[7]}/${n[8]}${n[9]}${n[10]}${n[11]}-${n[12]}${n[13]}`;
    }

    function gerarRG() {
        const n = Array.from({ length: 8 }, () => rand(0, 9));
        const pesos = [2, 3, 4, 5, 6, 7, 8, 9];
        const soma = n.reduce((acc, v, i) => acc + v * pesos[i], 0);
        const resto = 11 - (soma % 11);
        const dig = resto === 10 ? 'X' : resto === 11 ? '0' : String(resto);
        return `${n[0]}${n[1]}.${n[2]}${n[3]}${n[4]}.${n[5]}${n[6]}${n[7]}-${dig}`;
    }

    function gerarCNAE() {
        const grupos = [
            '62.01-5-00', '62.02-3-00', '62.03-1-00', '62.04-0-00',
            '63.11-9-00', '63.19-4-00', '72.10-0-00', '72.20-7-00',
            '58.11-5-00', '58.12-3-00', '73.19-0-03', '74.10-2-05',
        ];
        return pick(grupos);
    }

    // ==================== GERADORES (Faker pt_BR) ====================

    function gerarNomePessoa() {
        return faker.name.findName();
    }

    function gerarPrimeiroNome() {
        return faker.name.firstName();
    }

    function gerarSobrenome() {
        return faker.name.lastName();
    }

    function gerarEmail(nome) {
        const parts = nome.split(' ');
        const primeiro = parts[0];
        const ultimo = parts[parts.length - 1];
        return faker.internet.email(primeiro, ultimo).toLowerCase();
    }

    function gerarOrgaoEmissor() {
        return `SSP/${faker.address.stateAbbr()}`;
    }

    function gerarNomeEmpresa() {
        const prefixo = faker.name.lastName();
        const tipo = pick(['Soluções', 'Sistemas', 'Tecnologia', 'Consultoria', 'Desenvolvimento', 'Software', 'Digital', 'Informática', 'Inovação', 'Labs']);
        const sufixo = pick(['Ltda', 'S/A', 'ME', 'EPP', 'EIRELI']);
        return `${prefixo} ${tipo} ${sufixo}`;
    }

    function gerarNomeFantasia(razaoSocial) {
        return razaoSocial.replace(/ (Ltda|S\/A|ME|EPP|EIRELI)$/, '').trim();
    }

    function gerarSite(nomeEmpresa) {
        const base = nomeEmpresa.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
        return `https://www.${base}.com.br`;
    }

    // ==================== GERADORES (Telefone/Endereço — custom, formato BR exato) ====================

    function gerarTelefone() {
        const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '91', '47', '48', '27', '62', '65', '67', '68', '69', '82', '83', '84', '86', '87', '88', '92', '93', '94', '95', '96', '97', '98', '99'];
        return `(${pick(ddds)}) ${rand(2, 5)}${rand(100, 999)}-${rand(1000, 9999)}`;
    }

    function gerarCelular() {
        const ddds = ['11', '21', '31', '41', '51', '61', '71', '81', '85', '91', '47', '48', '27', '62', '65', '67', '68', '69', '82', '83', '84', '86', '87', '88', '92', '93', '94', '95', '96', '97', '98', '99'];
        return `(${pick(ddds)}) 9${rand(1000, 9999)}-${rand(1000, 9999)}`;
    }

    function gerarSenha() {
        const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower = 'abcdefghijklmnopqrstuvwxyz';
        const nums = '0123456789';
        const special = '!@#$%';
        const all = upper + lower + nums + special;
        let s = pick(upper) + pick(lower) + pick(nums) + pick(special);
        s += Array.from({ length: 8 }, () => all[rand(0, all.length - 1)]).join('');
        return s.split('').sort(() => Math.random() - 0.5).join('');
    }

    // Endereços reais (CEP bate com cidade/UF)
    const enderecos = [
        { cep: '01310100', logradouro: 'Avenida Paulista', bairro: 'Bela Vista', cidade: 'São Paulo', uf: 'SP' },
        { cep: '20040020', logradouro: 'Avenida Rio Branco', bairro: 'Centro', cidade: 'Rio de Janeiro', uf: 'RJ' },
        { cep: '30130110', logradouro: 'Avenida Afonso Pena', bairro: 'Centro', cidade: 'Belo Horizonte', uf: 'MG' },
        { cep: '80010010', logradouro: 'Rua XV de Novembro', bairro: 'Centro', cidade: 'Curitiba', uf: 'PR' },
        { cep: '90010190', logradouro: 'Rua dos Andradas', bairro: 'Centro Histórico', cidade: 'Porto Alegre', uf: 'RS' },
        { cep: '40020010', logradouro: 'Avenida Sete de Setembro', bairro: 'Centro', cidade: 'Salvador', uf: 'BA' },
        { cep: '60025061', logradouro: 'Avenida Duque de Caxias', bairro: 'Centro', cidade: 'Fortaleza', uf: 'CE' },
        { cep: '50010010', logradouro: 'Rua do Bom Jesus', bairro: 'Recife Antigo', cidade: 'Recife', uf: 'PE' },
        { cep: '74010010', logradouro: 'Avenida Goiás', bairro: 'Centro', cidade: 'Goiânia', uf: 'GO' },
        { cep: '88010000', logradouro: 'Rua Felipe Schmidt', bairro: 'Centro', cidade: 'Florianópolis', uf: 'SC' },
        { cep: '70040010', logradouro: 'SBS Quadra 2', bairro: 'Asa Sul', cidade: 'Brasília', uf: 'DF' },
        { cep: '13015080', logradouro: 'Rua Barão de Jaguara', bairro: 'Centro', cidade: 'Campinas', uf: 'SP' },
        { cep: '66010020', logradouro: 'Avenida Presidente Vargas', bairro: 'Campina', cidade: 'Belém', uf: 'PA' },
        { cep: '59010100', logradouro: 'Avenida Rio Branco', bairro: 'Cidade Alta', cidade: 'Natal', uf: 'RN' },
        { cep: '57020370', logradouro: 'Rua do Comércio', bairro: 'Centro', cidade: 'Maceió', uf: 'AL' },
        { cep: '64000040', logradouro: 'Rua Álvaro Mendes', bairro: 'Centro', cidade: 'Teresina', uf: 'PI' },
        { cep: '69005140', logradouro: 'Avenida Eduardo Ribeiro', bairro: 'Centro', cidade: 'Manaus', uf: 'AM' },
        { cep: '79002190', logradouro: 'Rua 14 de Julho', bairro: 'Centro', cidade: 'Campo Grande', uf: 'MS' },
        { cep: '78005300', logradouro: 'Avenida Isaac Póvoas', bairro: 'Centro Norte', cidade: 'Cuiabá', uf: 'MT' },
        { cep: '49010010', logradouro: 'Rua Laranjeiras', bairro: 'Centro', cidade: 'Aracaju', uf: 'SE' },
    ];

    function gerarEndereco() {
        return { ...pick(enderecos), numero: String(rand(1, 999)) };
    }

    // ==================== PREENCHEDOR (compatível com React) ====================

    function setReactValue(el, value) {
        const proto = el.tagName === 'TEXTAREA'
            ? window.HTMLTextAreaElement.prototype
            : window.HTMLInputElement.prototype;
        const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
        if (setter) setter.call(el, value);
        else el.value = value;

        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
        el.dispatchEvent(new Event('blur', { bubbles: true }));
    }

    function setSelect(select, value) {
        const option = Array.from(select.options).find(o =>
            o.value === value ||
            o.value.toLowerCase() === value.toLowerCase() ||
            o.text.toLowerCase().includes(value.toLowerCase())
        );
        if (option) {
            select.value = option.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function clickRadio(name, value) {
        const radio = document.querySelector(`input[type=radio][name="${name}"][value="${value}"]`);
        if (radio) {
            radio.click();
            radio.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        const radios = document.querySelectorAll(`input[type=radio][name="${name}"]`);
        if (radios.length) {
            const r = radios[rand(0, radios.length - 1)];
            r.click();
            r.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }
        return false;
    }

    function getLabelText(el) {
        if (el.id) {
            const lbl = document.querySelector(`label[for="${el.id}"]`);
            if (lbl) return lbl.textContent.toLowerCase();
        }
        const parent = el.closest('label');
        if (parent) return parent.textContent.toLowerCase();
        let prev = el.previousElementSibling;
        while (prev) {
            if (prev.tagName === 'LABEL') return prev.textContent.toLowerCase();
            prev = prev.previousElementSibling;
        }
        return '';
    }

    function match(el, ...keywords) {
        const haystack = [
            el.name, el.id, el.placeholder,
            el.getAttribute('data-field'),
            el.getAttribute('autocomplete'),
            el.getAttribute('aria-label'),
            getLabelText(el),
        ].filter(Boolean).join(' ').toLowerCase();
        return keywords.some(k => haystack.includes(k));
    }

    // ==================== LÓGICA PRINCIPAL ====================

    function preencherFormulario(tipo = 'empresa') {
        const isEmpresa = tipo === 'empresa';
        const razaoSocial = gerarNomeEmpresa();
        const nomeFantasia = gerarNomeFantasia(razaoSocial);
        const nomePessoa = gerarNomePessoa();
        const nomePrincipal = isEmpresa ? razaoSocial : nomePessoa;
        const emailEmpresa = gerarEmail(nomeFantasia.split(' ')[0] + ' ' + faker.name.lastName());
        const emailRepresentante = gerarEmail(nomePessoa);
        const end = gerarEndereco();
        const cpf = gerarCPF();
        const cnpj = gerarCNPJ();
        const celular = gerarCelular();
        const telefone = gerarTelefone();
        const senha = gerarSenha();

        let preenchidos = 0;

        // ── Mapeamento por ID específico (Softex/Brasil IT+) ──────────────────
        const mapaIds = {
            // Formulário de adesão - Empresa
            'razaoSocial': razaoSocial,
            'nomeFantasia': nomeFantasia,
            'cnpj': cnpj,
            'cnae': gerarCNAE(),

            // Contato
            'emailContato': emailEmpresa,
            'telefoneContato': celular,
            'site': gerarSite(nomeFantasia),

            // Endereço
            'cep': end.cep,
            'logradouro': end.logradouro,
            'numero': end.numero,
            'cidade': end.cidade,
            'complemento': faker.address.secondaryAddress(),

            // Representante legal
            'nomeRepresentante': nomePessoa,
            'cpfRepresentante': cpf,
            'rgRepresentante': gerarRG(),
            'orgaoEmissor': gerarOrgaoEmissor(),
            'emailRepresentante': emailRepresentante,
            'telefoneRepresentante': telefone,

            // Cadastro (signup)
            'name': nomePessoa,
            'email': emailRepresentante,
            'password': senha,
            'confirmPassword': senha,
        };

        // Preencher por ID exato
        Object.entries(mapaIds).forEach(([id, valor]) => {
            const el = document.getElementById(id);
            if (el && !el.disabled && !el.readOnly && el.tagName !== 'SELECT') {
                setReactValue(el, valor);
                preenchidos++;
            }
        });

        // Select estado por ID exato
        const selectEstado = document.getElementById('estado');
        if (selectEstado) {
            setSelect(selectEstado, end.uf);
            preenchidos++;
        }

        // ── Radio buttons Softex ──────────────────────────────────────────────
        clickRadio('perfilInstituicao', String(rand(1, 3)));
        clickRadio('participouReuniao', Math.random() > 0.5 ? 'sim' : 'nao');

        // ── Fallback genérico para outros inputs não cobertos acima ───────────
        const inputs = document.querySelectorAll(
            'input:not([type=hidden]):not([type=submit]):not([type=button]):not([type=reset]):not([type=checkbox]):not([type=radio]):not([type=file]), textarea'
        );

        inputs.forEach(el => {
            if (el.disabled || el.readOnly) return;
            if (el.id && mapaIds[el.id] !== undefined) return;
            if (el.value && el.value.trim()) return;

            let valor = null;

            if (match(el, 'cnpj')) valor = cnpj;
            else if (match(el, 'cpf')) valor = cpf;
            else if (match(el, 'rg', 'identidade')) valor = gerarRG();
            else if (match(el, 'orgao', 'emissor', 'orgão')) valor = gerarOrgaoEmissor();
            else if (match(el, 'inscricao', 'inscrição', 'estadual')) valor = Array.from({ length: 12 }, () => rand(0, 9)).join('');
            else if (match(el, 'cnae')) valor = gerarCNAE();
            else if (match(el, 'razao', 'razão', 'razaosocial', 'empresa', 'company')) valor = razaoSocial;
            else if (match(el, 'fantasia')) valor = nomeFantasia;
            else if (match(el, 'primeiro nome', 'first name', 'firstname')) valor = gerarPrimeiroNome();
            else if (match(el, 'sobrenome', 'last name', 'lastname', 'surname')) valor = gerarSobrenome();
            else if (match(el, 'nome', 'name', 'fullname')) valor = nomePrincipal;
            else if (match(el, 'email', 'e-mail') || el.type === 'email') valor = emailEmpresa;
            else if (match(el, 'confirmar', 'confirm', 'confirmpass') || el.id === 'confirmPassword') valor = senha;
            else if (match(el, 'senha', 'password', 'pass') || el.type === 'password') valor = senha;
            else if (match(el, 'celular', 'cell', 'mobile', 'whatsapp')) valor = celular;
            else if (match(el, 'telefone', 'phone', 'tel', 'fone', 'contato')) valor = telefone;
            else if (match(el, 'cep', 'zipcode', 'zip', 'postal')) valor = end.cep;
            else if (match(el, 'logradouro', 'endereço', 'endereco', 'address', 'rua', 'street')) valor = end.logradouro;
            else if (match(el, 'número', 'numero', 'nro', ' num', 'number')) valor = end.numero;
            else if (match(el, 'bairro', 'district')) valor = end.bairro;
            else if (match(el, 'cidade', 'city', 'municipio')) valor = end.cidade;
            else if (match(el, 'site', 'website', 'url', 'www') || el.type === 'url') valor = gerarSite(nomeFantasia);
            else if (match(el, 'complemento', 'complement', 'apto', 'sala')) valor = faker.address.secondaryAddress();
            else if (match(el, 'cargo', 'position', 'job', 'funcao', 'função')) valor = faker.name.jobTitle();
            else if (match(el, 'descri', 'observ', 'mensagem', 'message', 'comment')) valor = faker.lorem.sentence();

            if (valor !== null) {
                setReactValue(el, valor);
                preenchidos++;
            }
        });

        // Selects genéricos
        document.querySelectorAll('select').forEach(sel => {
            if (sel.disabled || sel.id === 'estado') return;
            if (match(sel, 'estado', ' uf ', 'state')) setSelect(sel, end.uf);
        });

        return { preenchidos, razaoSocial, cnpj, emailEmpresa, end };
    }

    // ==================== UOWN MISSING DATA ====================

    function preencherUOWNMissingData() {
        const nomePessoa = gerarNomePessoa();
        const partes = nomePessoa.trim().split(/\s+/);
        const primeiroNome = partes[0];
        const ultimoNome = partes[partes.length - 1];

        const CC_NUMBER = '6011000993026909';
        const CC_CVC    = '996';
        const CC_EXP    = '12/28';

        const routingNumbers = ['021000021', '011401533', '021200339', '091000022', '061000104'];
        const routingNumber  = pick(routingNumbers);
        const accountNumber  = Array.from({ length: rand(8, 12) }, () => rand(0, 9)).join('');

        let preenchidos = 0;

        const mapaIds = {
            'ccFirstName':                  primeiroNome,
            'ccLastName':                   ultimoNome,
            'ccValue':                      CC_NUMBER,
            'cvc':                          CC_CVC,
            'bankAccountCustomerFirstName': primeiroNome,
            'bankAccountCustomerLastName':  ultimoNome,
            'bankRoutingNumber':            routingNumber,
            'bankAccountNumber':            accountNumber,
            'achReEnterAccountNumber':      accountNumber,
        };

        Object.entries(mapaIds).forEach(([id, valor]) => {
            const el = document.getElementById(id);
            if (el && !el.disabled && !el.readOnly) {
                setReactValue(el, valor);
                preenchidos++;
            }
        });

        // Expiration date (react-datepicker — text input)
        const ccExpDate = document.getElementById('ccExpDate');
        if (ccExpDate) {
            setReactValue(ccExpDate, CC_EXP);
            preenchidos++;
        }

        // React Select — Account Type → Checking
        const accountTypeContainer = document.getElementById('bankAccountType');
        if (accountTypeContainer) {
            const control = accountTypeContainer.querySelector('[class*="control"]');
            if (control) {
                control.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                setTimeout(() => {
                    const options = document.querySelectorAll('[class*="option"]');
                    const checking = Array.from(options).find(o =>
                        o.textContent.toLowerCase().includes('checking')
                    );
                    if (checking) {
                        checking.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                        checking.click();
                        preenchidos++;
                    }
                }, 150);
            }
        }

        return { preenchidos };
    }

    function abrirReactSelect(containerId, keyword, aleatorio = false) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const control = container.querySelector('[class*="control"]');
        if (!control) return;
        control.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
        setTimeout(() => {
            const opcoes = Array.from(document.querySelectorAll('[class*="option"]'));
            if (!opcoes.length) return;
            const escolhida = aleatorio
                ? opcoes[rand(0, opcoes.length - 1)]
                : opcoes.find(o => o.textContent.trim().toLowerCase().includes(keyword.toLowerCase()));
            if (escolhida) {
                escolhida.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
                escolhida.click();
            }
        }, 150);
    }

    function preencherUOWNApplication() {
        const nomePessoa = gerarNomePessoa();
        const partes = nomePessoa.trim().split(/\s+/);
        const primeiroNome = partes[0];
        const ultimoNome = partes[partes.length - 1];

        // SSN: 9 dígitos (XXX XX XXXX sem formatação)
        const ssn = `${rand(100, 899)}${rand(10, 99)}${rand(1000, 9999)}`;

        // DOB: 25–55 anos, formato MM/DD/YYYY
        const hoje = new Date();
        const anoNasc = hoje.getFullYear() - rand(25, 55);
        const mesNasc = String(rand(1, 12)).padStart(2, '0');
        const diaNasc = String(rand(1, 28)).padStart(2, '0');
        const dob = `${mesNasc}/${diaNasc}/${anoNasc}`;

        // Telefone US: (XXX) XXX-XXXX — maxlength 14
        const phone = `(${rand(200, 999)}) ${rand(200, 999)}-${rand(1000, 9999)}`;

        // Email
        const email = gerarEmail(nomePessoa);

        // Endereços US (estado preenchido automaticamente pelo CEP no app)
        const usAddresses = [
            { street: '123 Main St',    city: 'Austin',       zip: '78701' },
            { street: '456 Oak Ave',    city: 'Phoenix',      zip: '85001' },
            { street: '789 Pine Rd',    city: 'Denver',       zip: '80201' },
            { street: '321 Elm St',     city: 'Nashville',    zip: '37201' },
            { street: '654 Maple Dr',   city: 'Charlotte',    zip: '28201' },
            { street: '987 Cedar Ln',   city: 'Columbus',     zip: '43201' },
            { street: '258 Walnut Way', city: 'Jacksonville', zip: '32201' },
            { street: '369 Spruce Ct',  city: 'Las Vegas',    zip: '89101' },
        ];
        const addr = pick(usAddresses);

        // Datas de pagamento: última = 7 dias atrás, próxima = 7 dias à frente
        const fmtDate = d =>
            `${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}/${d.getFullYear()}`;
        const lastPay = new Date(hoje); lastPay.setDate(hoje.getDate() - 7);
        const nextPay = new Date(hoje); nextPay.setDate(hoje.getDate() + 7);

        // Banco
        const routingNumbers = ['021000021', '011401533', '021200339', '091000022', '061000104'];
        const routingNumber = pick(routingNumbers);
        const accountNumber = Array.from({ length: rand(8, 12) }, () => rand(0, 9)).join('');

        let preenchidos = 0;

        const middleNames = ['James', 'Robert', 'William', 'Michael', 'David', 'Marie', 'Anne', 'Lynn'];

        const mapaIds = {
            // Step 1 — Dados pessoais
            'mainFirstName':         primeiroNome,
            'mainMiddleName':        pick(middleNames),
            'mainLastName':          ultimoNome,
            'mainSSN':               ssn,
            'mainDOB':               dob,
            'mainCellPhone':         phone,
            'emailAddress':          email,
            'mainAddress1':          addr.street,
            'mainPostalCode':        addr.zip,
            'mainCity':              addr.city,
            // mainStateOrProvince é disabled — preenchido automaticamente pelo app
            // Step 2 — Emprego
            'mainLastPayDate':       fmtDate(lastPay),
            'mainNextPayDate':       fmtDate(nextPay),
            'mainMonthlyIncome':     String(rand(3000, 7000)),
            'mainBankRoutingNumber': routingNumber,
            'mainBankAccountNumber': accountNumber,
            'mainCreditCardBin':     '601100',
        };

        // Preenche sem blur para evitar re-render do React/Formik resetar campos anteriores
        const camposPreenchidos = [];
        Object.entries(mapaIds).forEach(([id, valor]) => {
            const el = document.getElementById(id);
            if (el && !el.disabled && !el.readOnly) {
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                if (setter) setter.call(el, valor); else el.value = valor;
                el.dispatchEvent(new Event('input', { bubbles: true }));
                el.dispatchEvent(new Event('change', { bubbles: true }));
                camposPreenchidos.push(el);
                preenchidos++;
            }
        });
        // Dispara blur em todos após o loop — Formik valida com estado já commitado
        camposPreenchidos.forEach(el => el.dispatchEvent(new Event('blur', { bubbles: true })));

        // React Select: Suffix → aleatório (opcional)
        abrirReactSelect('mainSuffix', null, true);

        // React Select: Pay Frequency → aleatório
        abrirReactSelect('mainPayFrequency', null, true);

        // React Select: Bankruptcy → No
        abrirReactSelect('mainCurrentOrFutureBankruptcy', 'no');

        // Checkboxes: SMS consent + Privacy Policy
        ['isAgreedToStatements', 'isAgreedToPrivacyPolicy'].forEach(id => {
            const cb = document.getElementById(id);
            if (cb && !cb.checked) { cb.click(); preenchidos++; }
        });

        return { preenchidos };
    }

    // ==================== INTERFACE ====================

    function criarUI() {
        const btn = document.createElement('div');
        btn.id = '__bff_btn__';
        btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2 18.96V22h3.04L21.64 5.36a1.21 1.21 0 0 0 0-1.72z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>';
        btn.title = 'Brasil Form Filler (Faker)';
        Object.assign(btn.style, {
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            width: '25px',
            height: '25px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #009c3b, #002776)',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: '2147483647',
            boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
            userSelect: 'none',
            transition: 'transform 0.15s, box-shadow 0.15s',
        });

        btn.onmouseenter = () => {
            btn.style.transform = 'scale(1.1)';
            btn.style.boxShadow = '0 6px 20px rgba(0,0,0,0.45)';
        };
        btn.onmouseleave = () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 4px 14px rgba(0,0,0,0.35)';
        };

        // Menu
        const menu = document.createElement('div');
        menu.id = '__bff_menu__';
        Object.assign(menu.style, {
            position: 'fixed',
            bottom: '80px',
            right: '20px',
            background: '#fff',
            borderRadius: '10px',
            boxShadow: '0 6px 24px rgba(0,0,0,0.18)',
            padding: '6px',
            display: 'none',
            flexDirection: 'column',
            gap: '2px',
            zIndex: '2147483646',
            minWidth: '220px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
        });

        const titulo = document.createElement('div');
        titulo.innerHTML = '✦ <strong>Brasil Form Filler</strong> <span style="font-size:10px;color:#aaa">v3 faker</span>';
        Object.assign(titulo.style, {
            fontSize: '12px',
            color: '#555',
            padding: '8px 12px 4px',
        });
        menu.appendChild(titulo);

        const hr = document.createElement('hr');
        Object.assign(hr.style, { border: 'none', borderTop: '1px solid #eee', margin: '4px 8px' });
        menu.appendChild(hr);

        const itens = [
            { label: '🏢  Empresa / Softex', tipo: 'empresa', desc: 'CNPJ, razão social, representante...' },
            { label: '👤  Pessoa Física', tipo: 'pessoa', desc: 'CPF, RG, nome, endereço...' },
            { label: '💳  Cartão + Banco (UOWN)', tipo: 'uown', desc: 'CC fixo · ACH aleatório' },
            { label: '📋  Aplicação (UOWN)', tipo: 'aplicacao', desc: 'Dados pessoais + emprego + disclaimer' },
        ];

        itens.forEach(item => {
            const el = document.createElement('button');
            el.innerHTML = `<div style="font-size:14px;font-weight:500">${item.label}</div><div style="font-size:11px;color:#999;margin-top:2px">${item.desc}</div>`;
            Object.assign(el.style, {
                background: 'none',
                border: 'none',
                padding: '10px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                borderRadius: '6px',
                width: '100%',
                fontFamily: 'inherit',
            });
            el.onmouseenter = function() { this.style.background = '#f5f5f5'; };
            el.onmouseleave = function() { this.style.background = 'none'; };
            el.onclick = () => {
                menu.style.display = 'none';
                const r = item.tipo === 'uown'      ? preencherUOWNMissingData()
                        : item.tipo === 'aplicacao' ? preencherUOWNApplication()
                        : preencherFormulario(item.tipo);
                toast(`✅ ${r.preenchidos} campo(s) preenchido(s)`);
            };
            menu.appendChild(el);
        });

        btn.onclick = (e) => {
            e.stopPropagation();
            menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
        };

        document.addEventListener('click', () => { menu.style.display = 'none'; });

        document.body.appendChild(menu);
        document.body.appendChild(btn);
    }

    function toast(msg) {
        const t = document.createElement('div');
        t.textContent = msg;
        Object.assign(t.style, {
            position: 'fixed',
            bottom: '82px',
            right: '20px',
            background: '#222',
            color: '#fff',
            padding: '10px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            zIndex: '2147483647',
            fontFamily: 'system-ui, sans-serif',
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            transition: 'opacity 0.4s',
            opacity: '1',
        });
        document.body.appendChild(t);
        setTimeout(() => { t.style.opacity = '0'; }, 2200);
        setTimeout(() => t.remove(), 2700);
    }

    // ==================== INIT ====================

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', criarUI);
    } else {
        criarUI();
    }

})();
