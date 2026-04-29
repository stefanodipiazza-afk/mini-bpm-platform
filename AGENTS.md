# AGENTS.md

Guida operativa per lavorare su MINI-BPM-PLATFORM.

## Overview del progetto

MINI-BPM-PLATFORM e' una piattaforma BPM low-code single-tenant, pensata come MVP pragmatico stile Appian.

Il prodotto copre:

- disegno di workflow tramite JSON e UI React;
- pubblicazione del workflow nel motore Flowable;
- avvio e monitoraggio di istanze di processo;
- gestione task utente, claim e completamento task;
- form JSON-schema based;
- regole JSON per routing/decisioni;
- dashboard KPI e audit trail.

Struttura principale:

- `backend/`: API Java Spring Boot, persistenza JPA, integrazione Flowable.
- `frontend/`: UI Next.js/React per dashboard, workflow, task, istanze e form.
- `seed-data/`: processi e SQL di esempio.
- `docs/`: documentazione architetturale/API.
- `docker-compose.yml`: ambiente locale completo.

## Stack

Frontend:

- Next.js con App Router, React e TypeScript.
- Tailwind CSS per lo stile.
- Axios in `frontend/src/lib/api.ts` per chiamare le API.
- Hook dati in `frontend/src/hooks/useApi.ts`.
- Tipi condivisi frontend in `frontend/src/lib/types.ts`.
- Validazione form con Zod in `frontend/src/lib/validation.ts`.
- React Flow previsto per il designer workflow.

Backend:

- Java 21.
- Spring Boot 3.3.4.
- Spring Web, Data JPA, Validation, Mail.
- Flowable 7.0.0 come BPMN/process engine.
- Maven.
- Flyway per migrazioni DB.
- Lombok presente, ma non introdurre nuovo uso se il file/modulo non lo usa gia'.

Database e servizi:

- MySQL 8.0 come database applicativo e storage Flowable.
- Tabelle applicative principali: `process_definitions`, `process_instances`, `user_tasks`, `form_definitions`, `rule_definitions`, `execution_logs`.
- Migrazioni in `backend/src/main/resources/db/migration/`.
- Mailhog per email locali/test: SMTP `1025`, UI `8025`.

## Comandi principali con Docker

Dalla root del repository:

```bash
docker-compose up -d
```

Avvia MySQL, backend, frontend e Mailhog.

Endpoint locali:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8080/api`
- Mailhog UI: `http://localhost:8025`
- MySQL: `localhost:3306`, database `mini_bpm`, utente `bpm_user`, password `bpm_password`

Stato servizi:

```bash
docker-compose ps
```

Log:

```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql
```

Restart mirato:

```bash
docker-compose restart backend
docker-compose restart frontend
docker-compose restart mysql
```

Stop senza cancellare dati:

```bash
docker-compose down
```

Reset completo DB/volumi:

```bash
docker-compose down -v
docker-compose up -d
```

Accesso MySQL nel container:

```bash
docker exec -it mini-bpm-platform_mysql_1 mysql -u bpm_user -p mini_bpm
```

Build immagini:

```bash
docker build -t mini-bpm-backend:latest ./backend
docker build -t mini-bpm-frontend:latest ./frontend
```

## Comandi locali utili

Backend:

```bash
cd backend
mvn clean install
mvn spring-boot:run
mvn test
```

Frontend:

```bash
cd frontend
npm install
npm run dev
npm run build
npm run lint
```

Nota: `frontend/package.json` non espone attualmente uno script `test`.

## Principio architetturale non negoziabile

Design-time = workflow JSON.

Runtime = Flowable BPMN.

Regola pratica:

- Il frontend e le API di authoring devono manipolare il workflow come JSON leggibile/modificabile dal designer.
- La pubblicazione e' il confine in cui il JSON viene validato, trasformato in BPMN 2.0 XML e deployato su Flowable.
- L'esecuzione runtime deve passare da Flowable (`RuntimeService`, task Flowable, process instance Flowable), mantenendo in MySQL le entita' business e l'audit applicativo.
- Non introdurre logica runtime parallela che simula Flowable fuori da Flowable.
- Non far dipendere il designer frontend dal BPMN XML come formato primario di editing.
- Se cambi il formato JSON del workflow, aggiorna anche conversione BPMN, DTO, tipi frontend, seed data e documentazione/API coinvolte.

Attualmente il punto chiave e' `ProcessDefinitionService.publishProcessDefinition()`: prende `ProcessDefinition.definition`, genera BPMN XML e deploya su Flowable.

## Modalita' di lavoro per task lunghi

Per task complessi o multi-area, prima di implementare:

- leggere i file interessati e ricostruire il flusso reale end-to-end;
- scrivere un piano breve con milestone verificabili;
- indicare quali aree cambieranno: backend, frontend, DB, Docker/config, docs, seed data;
- chiarire il contratto atteso tra frontend, API, persistenza e Flowable;
- partire dal percorso piu' stretto che rende funzionante il comportamento richiesto.

Milestone consigliate:

- Milestone 1: modello/contratto dati definito e validato.
- Milestone 2: backend/API funzionante e verificato.
- Milestone 3: frontend allineato al contratto API.
- Milestone 4: integrazione Docker o runtime locale verificata.
- Milestone 5: docs, seed data e note operative aggiornate.

Validazione dopo ogni milestone:

- dopo una modifica backend, eseguire almeno il test/build Maven piu' vicino al cambiamento;
- dopo una modifica frontend, eseguire almeno lint/build o un controllo TypeScript equivalente;
- dopo una modifica DB, verificare che la migration sia ordinata, idempotente rispetto a Flyway e coerente con le entity;
- dopo una modifica workflow/runtime, verificare create/update JSON, publish, deploy Flowable e start instance;
- se una verifica non e' eseguibile, annotare subito il motivo e cosa resta a rischio.

Gestione dei diff:

- preferire diff piccoli, localizzati e leggibili;
- evitare refactor opportunistici dentro feature o bugfix;
- non riformattare file interi se il task richiede poche righe;
- separare cambi di contratto, UI, migration e documentazione quando possibile;
- mantenere nomi, pattern e stile gia' presenti nel modulo modificato;
- se un task richiede molti file, procedere per milestone e validare prima di ampliare lo scope.

Documentazione durante task lunghi:

- aggiornare `README.md`, `QUICKSTART.md`, `docs/` o questo file quando cambia un comportamento osservabile, un comando, una porta, una variabile ambiente, un endpoint o un formato JSON;
- aggiornare gli esempi in `seed-data/` quando cambia il formato di workflow, form o rule;
- non lasciare documentazione che descrive il comportamento vecchio dopo aver cambiato API o runtime.

## Regole di modifica del codice

Backend:

- I controller in `backend/src/main/java/com/bpm/controller/` devono restare sottili: routing HTTP, input/output, delega ai service.
- La logica business va nei service in `backend/src/main/java/com/bpm/service/`.
- L'accesso DB passa dai repository in `backend/src/main/java/com/bpm/repository/`.
- Non esporre direttamente entity JPA nelle risposte API: usare DTO in `backend/src/main/java/com/bpm/dto/`.
- Ogni nuova tabella o modifica schema va in una nuova migrazione Flyway, non con `ddl-auto` diverso da `validate`.
- Mantenere coerenza tra entity, repository, DTO, service, controller e migration.
- Le integrazioni Flowable devono restare isolate nel layer service/config, non nei componenti frontend ne' nei controller.
- Gestire errori applicativi con messaggi chiari; evitare `RuntimeException` generiche nei nuovi flussi quando serve un comportamento HTTP preciso.

Frontend:

- Le chiamate REST passano da `frontend/src/lib/api.ts`.
- I tipi API/UI vanno in `frontend/src/lib/types.ts`.
- La logica di fetch riusabile va in `frontend/src/hooks/useApi.ts`.
- Le pagine Next stanno in `frontend/src/app/`.
- Non duplicare stringhe endpoint nelle pagine: aggiungere funzioni al client API.
- Mantenere `NEXT_PUBLIC_API_URL` come unica configurazione del backend URL.
- Validare input form con gli schemi esistenti o nuovi schemi in `frontend/src/lib/validation.ts`.

Workflow, form e rule JSON:

- Salvare JSON valido come stringa solo dove il modello esistente lo richiede.
- Prima di persistere o pubblicare, validare struttura minima e campi obbligatori.
- Aggiornare `seed-data/` quando si cambia un formato supportato.
- Mantenere retrocompatibilita' quando possibile; se non possibile, documentare migrazione dei seed/dati.

Docker/config:

- Non hardcodare credenziali nuove nel codice: usare variabili ambiente o config gia' presenti.
- Se cambi porte, nomi servizi o env var in `docker-compose.yml`, aggiorna README/QUICKSTART e questa guida.
- Il backend in Docker usa host MySQL `mysql` e Mailhog `mailhog`; in locale servono override coerenti.

## Definizione di done per ogni task

Un task e' done solo quando:

- Il comportamento richiesto funziona nel punto utente/API interessato.
- Le modifiche sono limitate allo scope del task e non includono refactor non richiesti.
- Per task complessi, il piano iniziale e le milestone sono stati seguiti o aggiornati esplicitamente durante il lavoro.
- Ogni milestone significativa e' stata validata prima di passare alla successiva, oppure il rischio residuo e' stato scritto chiaramente.
- Backend: `mvn test` passa, oppure e' indicato chiaramente perche' non e' stato possibile eseguirlo.
- Frontend: `npm run build` e `npm run lint` passano, oppure e' indicato chiaramente perche' non e' stato possibile eseguirli.
- Se il task tocca Docker/config, `docker-compose up -d` e `docker-compose ps` confermano servizi avviabili, oppure viene documentato il blocco.
- Se il task tocca DB, esiste una migrazione Flyway nuova e ripetibile in startup pulito.
- Se il task tocca workflow/processi, e' verificato il ciclo: create/update JSON, publish, deploy Flowable, start instance, task/progresso atteso.
- Se il task tocca API, il client frontend e i tipi TypeScript sono allineati agli endpoint.
- Se il task cambia comportamento, comandi, endpoint, config, contratti o formati dati, sono aggiornati seed data e documentazione rilevante.
- Il diff finale e' piccolo quanto ragionevole, localizzato e privo di riformattazioni non necessarie.
- Non ci sono segreti reali, credenziali personali o file generati pesanti aggiunti per errore.
- La risposta finale al richiedente include cosa e' cambiato, verifiche fatte e verifiche non fatte.

## Percorsi da controllare spesso

- `README.md` e `QUICKSTART.md` per comandi e comportamento atteso.
- `docs/ARCHITECTURE.md` per decisioni architetturali.
- `backend/src/main/resources/application.yml` per config runtime.
- `backend/src/main/resources/db/migration/` per schema DB.
- `backend/src/main/java/com/bpm/service/ProcessDefinitionService.java` per confine JSON -> BPMN.
- `frontend/src/lib/api.ts` per contratto HTTP frontend/backend.
- `seed-data/processes/` e `seed-data/sql/` per esempi e dati iniziali.
