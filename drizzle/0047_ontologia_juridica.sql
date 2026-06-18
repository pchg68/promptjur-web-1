-- Ontologia Jurídica (JurisOS) — migration 0047
-- Grafo de conhecimento jurídico: 7 entidades + 4 tabelas de junção
-- RBAC: nós nascem em RASCUNHO; só PUBLICADO entra na montagem de contexto (axioma A6)

CREATE TABLE IF NOT EXISTS `ont_areas_direito` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(200) NOT NULL,
  `descricao` text,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ont_areas_direito_nome_unique` UNIQUE(`nome`),
  CONSTRAINT `ont_areas_direito_id` PRIMARY KEY(`id`)
);

CREATE TABLE IF NOT EXISTS `ont_dispositivos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `diploma` varchar(100) NOT NULL,
  `artigo` varchar(100) NOT NULL,
  `texto` text,
  `urlOficial` varchar(500),
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ont_dispositivos_id` PRIMARY KEY(`id`)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_disp_diploma_artigo` ON `ont_dispositivos` (`diploma`, `artigo`);

CREATE TABLE IF NOT EXISTS `ont_tipos_peca` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(200) NOT NULL,
  `sigla` varchar(20),
  `cabimento` text,
  `prazoDias` int,
  `areaId` int NOT NULL,
  `prazoBaseId` int,
  `status` enum('RASCUNHO','REVISAO','PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `ont_tipos_peca_nome_unique` UNIQUE(`nome`),
  CONSTRAINT `ont_tipos_peca_id` PRIMARY KEY(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_tp_status` ON `ont_tipos_peca` (`status`);
CREATE INDEX IF NOT EXISTS `idx_tp_area` ON `ont_tipos_peca` (`areaId`);

CREATE TABLE IF NOT EXISTS `ont_requisitos_legais` (
  `id` int AUTO_INCREMENT NOT NULL,
  `descricao` text NOT NULL,
  `obrigatorio` boolean NOT NULL DEFAULT true,
  `ordem` int NOT NULL DEFAULT 0,
  `tipoPecaId` int NOT NULL,
  `dispositivoId` int,
  CONSTRAINT `ont_requisitos_legais_id` PRIMARY KEY(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_req_tipo_peca` ON `ont_requisitos_legais` (`tipoPecaId`);

CREATE TABLE IF NOT EXISTS `ont_institutos` (
  `id` int AUTO_INCREMENT NOT NULL,
  `nome` varchar(200) NOT NULL,
  `descricao` text,
  `areaId` int,
  `status` enum('RASCUNHO','REVISAO','PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ont_institutos_nome_unique` UNIQUE(`nome`),
  CONSTRAINT `ont_institutos_id` PRIMARY KEY(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_inst_status` ON `ont_institutos` (`status`);

CREATE TABLE IF NOT EXISTS `ont_teses` (
  `id` int AUTO_INCREMENT NOT NULL,
  `enunciado` text NOT NULL,
  `favoravelA` enum('AUTOR','REU','AMBOS') NOT NULL DEFAULT 'AMBOS',
  `institutoId` int,
  `status` enum('RASCUNHO','REVISAO','PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ont_teses_id` PRIMARY KEY(`id`)
);
CREATE INDEX IF NOT EXISTS `idx_tese_instituto` ON `ont_teses` (`institutoId`);
CREATE INDEX IF NOT EXISTS `idx_tese_status` ON `ont_teses` (`status`);

CREATE TABLE IF NOT EXISTS `ont_precedentes` (
  `id` int AUTO_INCREMENT NOT NULL,
  `tipo` enum('SUMULA_VINCULANTE','REPETITIVO','REPERCUSSAO_GERAL','SUMULA','ACORDAO','IRDR','IAC','ORIENTACAO') NOT NULL,
  `tribunal` varchar(50) NOT NULL,
  `identificador` varchar(200) NOT NULL,
  `ementa` text,
  `urlOficial` varchar(500),
  `vinculante` boolean NOT NULL DEFAULT false,
  `dispositivoChave` varchar(200),
  `verificadoEm` timestamp,
  `status` enum('RASCUNHO','REVISAO','PUBLICADO') NOT NULL DEFAULT 'RASCUNHO',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `ont_precedentes_id` PRIMARY KEY(`id`)
);
CREATE UNIQUE INDEX IF NOT EXISTS `idx_prec_tribunal_id` ON `ont_precedentes` (`tribunal`, `identificador`);
CREATE INDEX IF NOT EXISTS `idx_prec_tipo` ON `ont_precedentes` (`tipo`);
CREATE INDEX IF NOT EXISTS `idx_prec_verificado` ON `ont_precedentes` (`verificadoEm`);
CREATE INDEX IF NOT EXISTS `idx_prec_status` ON `ont_precedentes` (`status`);

-- Tabelas de junção (arestas do grafo)

CREATE TABLE IF NOT EXISTS `ont_teses_peca` (
  `teseId` int NOT NULL,
  `tipoPecaId` int NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_tp_tese` ON `ont_teses_peca` (`teseId`);
CREATE INDEX IF NOT EXISTS `idx_tp_peca` ON `ont_teses_peca` (`tipoPecaId`);

CREATE TABLE IF NOT EXISTS `ont_teses_dispositivo` (
  `teseId` int NOT NULL,
  `dispositivoId` int NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_td_tese` ON `ont_teses_dispositivo` (`teseId`);
CREATE INDEX IF NOT EXISTS `idx_td_disp` ON `ont_teses_dispositivo` (`dispositivoId`);

-- Aresta-chave do verificador: existência = pertinência (axioma A2)
CREATE TABLE IF NOT EXISTS `ont_teses_precedente` (
  `teseId` int NOT NULL,
  `precedenteId` int NOT NULL,
  `peso` int NOT NULL DEFAULT 1
);
CREATE INDEX IF NOT EXISTS `idx_tpre_tese` ON `ont_teses_precedente` (`teseId`);
CREATE INDEX IF NOT EXISTS `idx_tpre_prec` ON `ont_teses_precedente` (`precedenteId`);

CREATE TABLE IF NOT EXISTS `ont_institutos_dispositivo` (
  `institutoId` int NOT NULL,
  `dispositivoId` int NOT NULL
);
CREATE INDEX IF NOT EXISTS `idx_id_inst` ON `ont_institutos_dispositivo` (`institutoId`);
CREATE INDEX IF NOT EXISTS `idx_id_disp` ON `ont_institutos_dispositivo` (`dispositivoId`);
