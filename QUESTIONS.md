# QUESTIONS.md — Decisiones de Diseño y Supuestos

Este documento recoge las principales decisiones de diseño tomadas durante el desarrollo de Complif, el razonamiento detrás de cada una y las preguntas abiertas para discusión futura.

---

## 1. Umbrales del Puntaje de Riesgo

**Decisión**: El riesgo por país suma **30 puntos**. El riesgo por industria suma **30 puntos**. Cada documento requerido faltante suma **20 puntos** (máximo 3 documentos requeridos = 60 puntos).

**Razonamiento**:
- La escala llega hasta 100, por lo que se necesitaban incrementos con sentido que permitan clasificar claramente las combinaciones como "bajo" (0-30), "medio" (31-69) o "alto" (70-100).
- El país y la industria son riesgos estructurales que en gran medida se fijan al momento del alta de la empresa, por lo que cada uno contribuye con un peso significativo (30 puntos).
- La completitud documental es el factor de riesgo más accionable — las empresas pueden subir documentos en cualquier momento —, por lo que la penalización se distribuye en tres documentos a 20 puntos cada uno. Esto significa que una empresa con todos sus documentos pero de un país de alto riesgo obtiene 30 (medio), sin entrar en la zona de revisión automática.
- El umbral de "IN_REVIEW automático" de 70 se activa cuando al menos 2 factores de alto riesgo están presentes de forma simultánea (ej: país de alto riesgo + 2 documentos faltantes, o país de alto riesgo + industria de alto riesgo).

**Pregunta abierta**: ¿Deberían los umbrales ser configurables por cuenta de cliente (modelo B2B2B) en lugar de estar hardcodeados?

---

## 2. Lista de Países de Alto Riesgo

**Decisión**: Los siguientes países están marcados como de alto riesgo:
Irán, Corea del Norte, Siria, Cuba, Sudán, Myanmar, Venezuela, Rusia, Bielorrusia, Libia, Somalia, Yemen.

**Razonamiento**:
- Estos países figuran en las listas de sanciones de OFAC (Oficina de Control de Activos Extranjeros), en las listas de jurisdicciones de alto riesgo del GAFI (Grupo de Acción Financiera Internacional), o están sujetos a restricciones comerciales internacionales que afectarían a una empresa operando en el mercado argentino/mexicano.
- Los países sin tratados activos de intercambio de información fiscal con Argentina fueron un criterio secundario, pero el principal impulsor son las sanciones internacionales y la normativa AML (Anti-Lavado de Dinero).
- La lista es intencionalmente conservadora para un MVP — un sistema de producción consumiría una base de datos de sanciones en tiempo real (ej: OpenSanctions).

**Supuesto**: Los nombres de los países se comparan sin distinción de mayúsculas/minúsculas como cadenas exactas. Un sistema de producción debería usar códigos ISO 3166-1 alpha-2 para evitar inconsistencias de localización.

---

## 3. Industrias de Alto Riesgo

**Decisión**: Las siguientes industrias están marcadas como de alto riesgo (sin distinción de mayúsculas/minúsculas):
`construction`, `security`, `exchange`, `casino`, `gambling`, `casas de cambio`, `construccion`, `seguridad`.

**Razonamiento**:
- Estas industrias son habitualmente señaladas en los marcos AML/KYB por sus operaciones intensivas en efectivo, su complejidad regulatoria o su asociación histórica con el lavado de dinero.
- Las variantes en español (`casas de cambio`, `construccion`, `seguridad`) están incluidas porque la plataforma opera en Argentina y México, donde los usuarios pueden ingresar los rubros en español.
- "Exchange" y "casas de cambio" cubren específicamente los negocios de cambio de divisas, que están estrechamente regulados por el BCRA (Banco Central de la República Argentina) y la CNBV (México).

**Pregunta abierta**: La comparación actual es de igualdad exacta de cadenas. Un enfoque de coincidencia aproximada (fuzzy-match) o basado en taxonomías (ej: códigos NAICS) sería más robusto.

---

## 4. Documentos Requeridos

**Decisión**: Tres tipos de documentos son "requeridos" para el cálculo del puntaje de riesgo:
1. `TAX_CERTIFICATE` — Constancia de inscripción fiscal (certificado de CUIT en Argentina, constancia de RFC en México).
2. `REGISTRATION` — Documento oficial de constitución de la empresa (Acta Constitutiva, Boletín Oficial).
3. `INSURANCE_POLICY` — Póliza de seguro de responsabilidad civil u otra póliza aplicable.

**Razonamiento**:
- Estos tres documentos representan el paquete de cumplimiento mínimo viable para un caso de uso de onboarding B2B en el mercado argentino/mexicano.
- Pueden verificarse contra fuentes gubernamentales oficiales (AFIP, SAT) incluso sin una integración automatizada.
- Otros tipos de documentos (`INCORPORATION_DEED`, `POWER_OF_ATTORNEY`, `OTHER`) se registran pero no afectan el puntaje de riesgo — son evidencia complementaria.

**Supuesto**: La definición de "requerido" es global para todas las cuentas de clientes. Un sistema de producción multi-tenant permitiría a cada cliente configurar sus propios tipos de documentos requeridos.

---

## 5. Validación del CUIT

**Decisión**: El CUIT se valida con reglas de formato y verificación de dígito verificador.

**Supuestos de formato**:
- El input puede estar en formato `XX-XXXXXXXX-X` (con guiones) o `XXXXXXXXXXX` (11 dígitos sin guiones). Los guiones se eliminan antes de la validación.
- Prefijos de tipo válidos: `20`, `23`, `24` (persona física masculina), `27` (persona física femenina), `30`, `33`, `34` (persona jurídica/empresa).
- El checksum usa multiplicadores `[5, 4, 3, 2, 7, 6, 5, 4, 3, 2]` aplicados a los dígitos 1-10.
- Un resto de `1` (mod 11) se rechaza explícitamente porque produciría un dígito verificador de `10`, que no es un dígito único e indica un CUIT estructuralmente inválido.
- Un resto de `0` corresponde al dígito verificador `0`; todos los demás restos producen el dígito verificador `11 - resto`.

**Fuente**: Documentación oficial de AFIP y la especificación de numeración de la Ley 23.314.

**Supuesto**: No se valida si el CUIT está efectivamente registrado en AFIP (eso requeriría la API de AFIP). Solo se valida la estructura matemática.

---

## 6. Transiciones de Estado

**Decisión**: Cualquier estado puede transicionar a cualquier otro estado (`PENDING` -> `APPROVED`, `REJECTED` -> `IN_REVIEW`, etc.). La API no impone un grafo de transiciones.

**Razonamiento**:
- Imponer una máquina de estados estricta (ej: solo `IN_REVIEW` -> `APPROVED`) agrega complejidad y puede no reflejar flujos de trabajo de cumplimiento reales, donde un revisor podría necesitar reabrir un caso rechazado.
- Para la simplicidad del MVP, el control por rol (`ADMIN` únicamente) es la principal salvaguarda contra transiciones inválidas.
- Los cambios de estado siempre se registran en `StatusHistory` con el usuario que realizó el cambio, lo que proporciona un historial de auditoría completo independientemente de las transiciones permitidas.

**Pregunta abierta**: ¿Deberíamos agregar una configuración `transition_rules` que restrinja qué cambios de estado son válidos? Esto podría ser útil en un entorno regulado.

---

## 7. Reemplazo de Documentos

**Decisión**: Si se sube el mismo `documentType` dos veces para la misma empresa, el **nuevo archivo reemplaza al anterior**. El registro del documento anterior se elimina y se guarda el nuevo.

**Razonamiento**:
- Mantener ambas versiones (versionado) agrega complejidad a la UI y a la lógica del puntaje de riesgo (¿cuál documento es el "actual"?).
- A efectos de cumplimiento, la versión más reciente de un documento es la autorizada.
- El reemplazo es una operación atómica: el archivo anterior se elimina del disco y el registro anterior de la BD se borra antes de crear el nuevo.

**Supuesto**: La estrategia de reemplazo se aplica por par `(businessId, documentType)`. Dos empresas pueden tener el mismo tipo de documento de forma independiente.

**Pregunta abierta**: Para un sistema de auditoría de nivel productivo, los borrados lógicos (conservar el registro anterior con un timestamp `deletedAt`) proporcionarían mejor trazabilidad de cumplimiento.

---

## 8. Estado Automático en Alto Riesgo

**Decisión**: Cuando se crea una empresa con `riskScore > 70`, su estado se establece automáticamente en `IN_REVIEW` (sobreescribiendo el `PENDING` por defecto).

**Razonamiento**:
- Un puntaje de riesgo superior a 70 indica al menos dos factores de riesgo simultáneos (ej: país de alto riesgo + industria de alto riesgo, o país de alto riesgo + 2 documentos faltantes).
- Enviar estos casos directamente a `IN_REVIEW` garantiza que un revisor humano los vea de inmediato sin necesidad de un paso manual en el flujo de trabajo.
- El umbral de 70 se eligió para capturar riesgos combinados sin disparar demasiados falsos positivos en casos de un solo factor (ej: una empresa legítima de Rusia con todos sus documentos obtiene 30 y queda en `PENDING`).

**Nota**: Al momento de la creación, no se han subido documentos aún, por lo que el puntaje base por documentos faltantes es 60 (3 faltantes x 20). Cualquier bandera de país o industria de alto riesgo llevará el puntaje a 90, activando la revisión automática.

---

## 9. Autenticación Frontend — localStorage vs. Cookies httpOnly

**Decisión**: El token de acceso JWT se almacena en `localStorage` en el frontend.

**Razonamiento**:
- `localStorage` es más simple de implementar en una aplicación Next.js sin una capa BFF (Backend for Frontend) dedicada.
- Para un MVP/desafío técnico, reducir la complejidad de infraestructura es la prioridad.

**Compensaciones y riesgos**:
- `localStorage` es accesible desde JavaScript, lo que lo hace vulnerable a ataques XSS (Cross-Site Scripting). Si un atacante inyecta un script, puede robar el token.
- Las cookies `httpOnly` impedirían el acceso desde JavaScript y son el enfoque recomendado para sistemas productivos. Requieren que el backend establezca el header `Set-Cookie` y que el frontend envíe las solicitudes con `credentials: 'include'`.
- Una implementación productiva completa debería migrar a cookies `httpOnly` con protección CSRF (ej: patrón de doble cookie o el atributo `SameSite=Strict`).

**Justificación de la decisión**: La plataforma es una herramienta B2B interna con acceso controlado, lo que reduce (pero no elimina) el riesgo de XSS. El MVP acepta esta compensación de forma consciente.

---

## 10. Servicio de Validación — ¿Por qué un Microservicio Separado?

**Decisión**: La validación del CUIT está implementada como un microservicio Express independiente (`validation-service/`) en lugar de una función de librería dentro del backend.

**Razonamiento**:

1. **Despliegue independiente**: El servicio de validación puede desplegarse, escalarse y actualizarse de forma independiente. Si AFIP cambia el algoritmo del CUIT, solo este servicio necesita ser redesplégado.

2. **Escalabilidad**: La validación es una operación sin estado y orientada a CPU. Puede escalarse horizontalmente de forma independiente del backend stateful (que mantiene conexiones a la base de datos).

3. **Reutilización**: Otros servicios (ej: un futuro backend de app móvil o un servicio de importación por lotes) pueden llamar al endpoint de validación sin duplicar la lógica.

4. **Separación de responsabilidades**: El backend es responsable de la persistencia y los flujos de negocio. El servicio de validación es responsable de la verificación de formato y reglas. Esto sigue el Principio de Responsabilidad Única a nivel de servicio.

5. **Independencia tecnológica**: En el futuro, el servicio de validación podría reescribirse en otro lenguaje (ej: Python para procesamiento intensivo de expresiones regulares) sin tocar el backend.

**Compensación**: Se agrega un salto de red por cada creación de empresa. Se mitiga ejecutando ambos servicios en la misma red Docker (latencia interna de sub-milisegundos) y pudiendo cachear resultados de validación en el futuro si fuera necesario.
