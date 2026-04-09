/* Configuración del Analizador para Lenguaje Wison */
%lex
%options case-sensitive

%%
\s+                   /* ignorar */
"#".* /* comentario linea */
"/*"[\s\S]*?"*/"    /* comentario bloque */

"Wison¿"                    return 'WISON_INI';
"?Wison"                    return 'WISON_FIN';
"Lex"                       return 'LEX_RES';
"Syntax"                    return 'SYNTAX_RES';
"Terminal"                  return 'TERMINAL_RES';
"No_Terminal"               return 'NOTERMINAL_RES';
"Initial_Sim"               return 'INITIAL_RES';

"<-"                        return 'ASIGNAR';
"<="                        return 'PRODUCCION';
"{{:"                       return 'INI_SYNTAX';
":}}"                       return 'FIN_SYNTAX';
"{:"                        return 'INI_BLOQUE';
":}"                        return 'FIN_BLOQUE';
"|"                         return 'OR';
";"                         return 'PTOC_COMA';
"*"                         return 'KLEENE';
"+"                         return 'POSSITIVE';
"?"                         return 'OPTIONAL';
"("                         return 'PAR_ABRE';
")"                         return 'PAR_CIERRA';

"epsilon"                   return 'EPSILON_RES';
"$_"[a-zA-Z0-9_]+           return 'ID_TERMINAL';
"%_"[a-zA-Z0-9_]+           return 'ID_NOTERMINAL';

"'"[^']*"'"                 return 'CADENA';
"["[a-zA-Z0-9\-]+"]"        return 'RANGO'; 

<<EOF>>                     return 'EOF';

/lex

%start inicio

%%

inicio 
    : WISON_INI cuerpo_wison WISON_FIN EOF { return $2; } 
    ;

cuerpo_wison 
    : bloque_lex bloque_syntax { $$ = { lex: $1, syntax: $2 }; }
    ;

bloque_lex 
    : LEX_RES INI_BLOQUE lista_terminales FIN_BLOQUE { $$ = $3; }
    ;

lista_terminales 
    : lista_terminales declaracion_terminal { $1.push($2); $$ = $1; }
    | declaracion_terminal { $$ = [$1]; }
    ;

declaracion_terminal 
    : TERMINAL_RES ID_TERMINAL ASIGNAR expresion_reg PTOC_COMA 
      { $$ = { id: $2, expresion: $4 }; }
    ;
expresion_reg
    : expresion_reg OR expresion_reg_simple 
      { $1.push({ tipo: 'or', valor: $3 }); $$ = $1; }
    | expresion_reg_simple { $$ = $1; }
    ;

expresion_reg_simple
    : expresion_reg_simple parte_re { $1.push($2); $$ = $1; }
    | parte_re { $$ = [$1]; }
    ;

parte_re
    : atomo { $$ = { tipo: 'atomo', valor: $1 }; }
    | atomo KLEENE { $$ = { tipo: 'kleene', valor: $1 }; }
    | atomo POSSITIVE { $$ = { tipo: 'positivo', valor: $1 }; }
    | atomo OPTIONAL { $$ = { tipo: 'opcional', valor: $1 }; }
    ;

atomo
    : CADENA { $$ = $1; }
    | RANGO { $$ = $1; }
    | ID_TERMINAL { $$ = $1; }
    | PAR_ABRE expresion_reg PAR_CIERRA { $$ = { tipo: 'agrupacion', valor: $2 }; }
    ;

bloque_syntax 
    : SYNTAX_RES INI_SYNTAX declaraciones_no_term simbolo_inicial producciones FIN_SYNTAX 
      { $$ = { no_terminales: $3, inicial: $4, reglas: $5 }; }
    ;

declaraciones_no_term 
    : declaraciones_no_term NOTERMINAL_RES ID_NOTERMINAL PTOC_COMA { $1.push($3); $$ = $1; }
    | NOTERMINAL_RES ID_NOTERMINAL PTOC_COMA { $$ = [$2]; }
    ;

simbolo_inicial 
    : INITIAL_RES ID_NOTERMINAL PTOC_COMA { $$ = $2; }
    ;

producciones 
    : producciones regla { $1.push($2); $$ = $1; }
    | regla { $$ = [$1]; }
    ;

regla 
    : ID_NOTERMINAL PRODUCCION lista_opciones PTOC_COMA 
      { $$ = { no_terminal: $1, opciones: $3 }; }
    ;

lista_opciones
    : lista_opciones OR opcion_individual { $1.push($3); $$ = $1; }
    | opcion_individual { $$ = [$1]; }
    ;

opcion_individual
    : lista_simbolos { $$ = $1; }
    | EPSILON_RES    { $$ = [{ tipo: 'TERMINAL', id: 'epsilon' }]; }
    | /* vacío */    { $$ = [{ tipo: 'TERMINAL', id: 'epsilon' }]; }
    ;

lista_simbolos
    : lista_simbolos simbolo { $1.push($2); $$ = $1; }
    | simbolo { $$ = [$1]; }
    ;

simbolo 
    : ID_NOTERMINAL { $$ = { tipo: 'NO_TERMINAL', id: $1 }; }
    | ID_TERMINAL { $$ = { tipo: 'TERMINAL', id: $1 }; }
    ;